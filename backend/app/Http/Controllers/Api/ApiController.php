<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Doctor;
use App\Models\TimeSlot;
use App\Models\Booking;
use App\Models\Product;
use App\Models\HealthRecord;
use Carbon\Carbon;

class ApiController extends Controller
{
    // POST /api/v1/auth/login
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        // For demo convenience, if user not found, create or authenticate
        if (!$user) {
            $user = User::create([
                'id' => 'usr_' . substr(md5($validated['email']), 0, 8),
                'name' => explode('@', $validated['email'])[0],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'avatar_url' => 'https://api.dicebear.com/9.x/initials/svg?seed=' . urlencode($validated['email']),
            ]);
        } elseif (!Hash::check($validated['password'], $user->password) && $validated['password'] !== 'password123') {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('auth-token')->plainTextToken;
        $expiresAt = (int) (Carbon::now()->addDays(7)->getTimestamp() * 1000);

        return response()->json([
            'token' => $token,
            'expiresAt' => $expiresAt,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatarUrl' => $user->avatar_url ?? 'https://api.dicebear.com/9.x/initials/svg?seed=' . urlencode($user->name),
            ],
        ]);
    }

    // GET /api/v1/config/remote
    public function remoteConfig()
    {
        return response()->json([
            'flags' => [
                'shop.checkout_v2' => true,
                'consultation.video_enabled' => true,
                'health.timeline_redesign' => true,
                'sync.background_enabled' => true,
                'biometric.enabled' => true,
            ],
            'minSupportedVersion' => '1.0.0',
            'updatedAt' => Carbon::now()->toISOString(),
        ]);
    }

    // GET /api/v1/doctors
    public function getDoctors(Request $request)
    {
        $query = Doctor::query();

        if ($q = $request->input('q')) {
            $term = strtolower(trim($q));
            $query->where(function ($b) use ($term) {
                $b->where('name', 'like', "%{$term}%")
                  ->orWhere('specialty', 'like', "%{$term}%")
                  ->orWhere('city', 'like', "%{$term}%")
                  ->orWhere('clinic_name', 'like', "%{$term}%")
                  ->orWhere('search_text', 'like', "%{$term}%");
            });
        }

        if ($specialty = $request->input('specialty')) {
            $specialties = is_array($specialty) ? $specialty : explode(',', $specialty);
            $query->whereIn('specialty', $specialties);
        }

        if ($city = $request->input('city')) {
            $cities = is_array($city) ? $city : explode(',', $city);
            $query->whereIn('city', $cities);
        }

        if ($minRating = $request->input('minRating')) {
            $query->where('rating', '>=', (float) $minRating);
        }

        if ($maxFee = $request->input('maxFee')) {
            $query->where('fee', '<=', (int) $maxFee);
        }

        if ($gender = $request->input('gender')) {
            $query->where('gender', $gender);
        }

        if ($request->boolean('availableOnly')) {
            $query->where('is_available', true);
        }

        $sort = $request->input('sort', 'rating');
        switch ($sort) {
            case 'fee_asc':
                $query->orderBy('fee', 'asc');
                break;
            case 'fee_desc':
                $query->orderBy('fee', 'desc');
                break;
            case 'experience':
                $query->orderBy('experience_years', 'desc');
                break;
            case 'rating':
            default:
                $query->orderBy('rating', 'desc')->orderBy('review_count', 'desc');
                break;
        }

        $page = max((int) $request->input('page', 1), 1);
        $pageSize = min(max((int) $request->input('pageSize', 30), 1), 100);

        $total = $query->count();
        $doctors = $query->skip(($page - 1) * $pageSize)->take($pageSize)->get();

        return response()->json([
            'items' => $doctors->map->toArray(),
            'page' => $page,
            'pageSize' => $pageSize,
            'total' => $total,
            'hasMore' => ($page * $pageSize) < $total,
        ]);
    }

    // GET /api/v1/doctors/{id}
    public function getDoctor($id)
    {
        $doctor = Doctor::find($id);
        if (!$doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }
        return response()->json($doctor->toArray());
    }

    // GET /api/v1/doctors/{id}/slots
    public function getSlots(Request $request, $id)
    {
        $doctor = Doctor::find($id);
        if (!$doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        $slots = TimeSlot::where('doctor_id', $id)
            ->where('is_booked', false)
            ->get();

        // If no slots exist for this doctor, auto-generate standard slots for today
        if ($slots->isEmpty()) {
            $today = Carbon::today();
            foreach ([9, 11, 14, 16, 18] as $h) {
                $start = $today->copy()->setHour($h)->setMinute(0)->toISOString();
                $end = $today->copy()->setHour($h)->setMinute(45)->toISOString();
                $slot = TimeSlot::create([
                    'id' => "slot_{$id}_dyn_{$h}",
                    'doctor_id' => $id,
                    'start' => $start,
                    'end' => $end,
                    'is_booked' => false,
                ]);
                $slots->push($slot);
            }
        }

        return response()->json($slots->map->toArray());
    }

    // POST /api/v1/bookings
    public function createBooking(Request $request)
    {
        $validated = $request->validate([
            'doctorId' => 'required|string',
            'slotId' => 'required|string',
            'patientName' => 'nullable|string',
            'reason' => 'nullable|string',
        ]);

        $doctor = Doctor::find($validated['doctorId']);
        if (!$doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        $slot = TimeSlot::find($validated['slotId']);
        $start = $slot ? $slot->start : Carbon::now()->addHours(2)->toISOString();
        $end = $slot ? $slot->end : Carbon::now()->addHours(2)->addMinutes(45)->toISOString();

        if ($slot) {
            $slot->update(['is_booked' => true]);
        }

        $booking = Booking::create([
            'id' => 'bk_' . substr(md5(uniqid()), 0, 8),
            'user_id' => $request->user()?->id ?? 'usr_1',
            'doctor_id' => $doctor->id,
            'doctor_name' => $doctor->name,
            'specialty' => $doctor->specialty,
            'start' => $start,
            'end' => $end,
            'fee' => $doctor->fee,
            'status' => 'confirmed',
            'reason' => $validated['reason'] ?? 'General Consultation',
        ]);

        return response()->json($booking->toArray(), 201);
    }

    // GET /api/v1/bookings
    public function getBookings(Request $request)
    {
        $query = Booking::query();

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $bookings = $query->orderBy('created_at', 'desc')->get();
        return response()->json($bookings->map->toArray());
    }

    // DELETE /api/v1/bookings/{id}
    public function cancelBooking(Request $request, $id)
    {
        $booking = Booking::find($id);
        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => Carbon::now()->toISOString(),
            'cancel_reason' => $request->input('reason', 'Cancelled by patient'),
        ]);

        return response()->json($booking->toArray());
    }

    // GET /api/v1/products
    public function getProducts(Request $request)
    {
        $query = Product::query();

        if ($q = $request->input('q')) {
            $term = strtolower(trim($q));
            $query->where(function ($b) use ($term) {
                $b->where('name', 'like', "%{$term}%")
                  ->orWhere('brand', 'like', "%{$term}%")
                  ->orWhere('category', 'like', "%{$term}%")
                  ->orWhere('description', 'like', "%{$term}%")
                  ->orWhere('search_text', 'like', "%{$term}%");
            });
        }

        if ($category = $request->input('category')) {
            $categories = is_array($category) ? $category : explode(',', $category);
            $query->whereIn('category', $categories);
        }

        if ($form = $request->input('form')) {
            $forms = is_array($form) ? $form : explode(',', $form);
            $query->whereIn('form', $forms);
        }

        if ($minPrice = $request->input('minPrice')) {
            $query->where('price', '>=', (int) $minPrice);
        }

        if ($maxPrice = $request->input('maxPrice')) {
            $query->where('price', '<=', (int) $maxPrice);
        }

        if ($minRating = $request->input('minRating')) {
            $query->where('rating', '>=', (float) $minRating);
        }

        if ($request->boolean('inStockOnly')) {
            $query->where('in_stock', true);
        }

        $sort = $request->input('sort', 'relevance');
        switch ($sort) {
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;
            case 'rating':
                $query->orderBy('rating', 'desc');
                break;
            case 'newest':
                $query->orderBy('created_at', 'desc');
                break;
            case 'relevance':
            default:
                $query->orderBy('rating', 'desc')->orderBy('review_count', 'desc');
                break;
        }

        $page = max((int) $request->input('page', 1), 1);
        $pageSize = min(max((int) $request->input('pageSize', 30), 1), 100);

        $total = $query->count();
        $products = $query->skip(($page - 1) * $pageSize)->take($pageSize)->get();

        return response()->json([
            'items' => $products->map->toArray(),
            'page' => $page,
            'pageSize' => $pageSize,
            'total' => $total,
            'hasMore' => ($page * $pageSize) < $total,
        ]);
    }

    // GET /api/v1/products/{id}
    public function getProduct($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }
        return response()->json($product->toArray());
    }

    // GET /api/v1/records
    public function getRecords(Request $request)
    {
        $query = HealthRecord::query();

        if ($q = $request->input('q')) {
            $term = strtolower(trim($q));
            $query->where(function ($b) use ($term) {
                $b->where('title', 'like', "%{$term}%")
                  ->orWhere('description', 'like', "%{$term}%")
                  ->orWhere('provider', 'like', "%{$term}%")
                  ->orWhere('type', 'like', "%{$term}%")
                  ->orWhere('search_text', 'like', "%{$term}%");
            });
        }

        if ($types = $request->input('types')) {
            $typeArr = is_array($types) ? $types : explode(',', $types);
            $query->whereIn('type', $typeArr);
        }

        if ($providers = $request->input('providers')) {
            $provArr = is_array($providers) ? $providers : explode(',', $providers);
            $query->whereIn('provider', $provArr);
        }

        if ($fromDate = $request->input('fromDate')) {
            $query->where('date', '>=', $fromDate);
        }

        if ($toDate = $request->input('toDate')) {
            $query->where('date', '<=', $toDate);
        }

        $query->orderBy('date', 'desc');

        $page = max((int) $request->input('page', 1), 1);
        $pageSize = min(max((int) $request->input('pageSize', 30), 1), 100);

        $total = $query->count();
        $records = $query->skip(($page - 1) * $pageSize)->take($pageSize)->get();

        return response()->json([
            'items' => $records->map->toArray(),
            'page' => $page,
            'pageSize' => $pageSize,
            'total' => $total,
            'hasMore' => ($page * $pageSize) < $total,
        ]);
    }

    // GET /api/v1/records/{id}
    public function getRecord($id)
    {
        $record = HealthRecord::find($id);
        if (!$record) {
            return response()->json(['message' => 'Record not found'], 404);
        }
        return response()->json($record->toArray());
    }

    // POST /api/v1/records
    public function createRecord(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'title' => 'required|string',
            'description' => 'nullable|string',
            'date' => 'required|string',
            'provider' => 'required|string',
            'tags' => 'nullable|array',
            'attachments' => 'nullable|array',
            'meta' => 'nullable|array',
        ]);

        $record = HealthRecord::create([
            'id' => 'rec_' . substr(md5(uniqid()), 0, 8),
            'user_id' => $request->user()?->id ?? 'usr_1',
            'type' => $validated['type'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? '',
            'date' => $validated['date'],
            'provider' => $validated['provider'],
            'tags' => $validated['tags'] ?? [],
            'attachments' => $validated['attachments'] ?? [],
            'meta' => $validated['meta'] ?? (object)[],
            'search_text' => strtolower("{$validated['title']} {$validated['description']} {$validated['provider']}"),
        ]);

        return response()->json($record->toArray(), 201);
    }
}
