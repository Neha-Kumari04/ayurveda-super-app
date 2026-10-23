<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Doctor extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'name', 'specialty', 'experience_years', 'rating', 'review_count',
        'fee', 'gender', 'languages', 'city', 'clinic_name', 'avatar_url',
        'bio', 'qualifications', 'specializations', 'next_available_at',
        'is_available', 'search_text',
    ];

    protected $casts = [
        'experience_years' => 'integer',
        'rating' => 'float',
        'review_count' => 'integer',
        'fee' => 'integer',
        'languages' => 'array',
        'qualifications' => 'array',
        'specializations' => 'array',
        'is_available' => 'boolean',
    ];

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'specialty' => $this->specialty,
            'experienceYears' => (int) $this->experience_years,
            'rating' => (float) $this->rating,
            'reviewCount' => (int) $this->review_count,
            'fee' => (int) $this->fee,
            'gender' => $this->gender,
            'languages' => $this->languages ?? [],
            'city' => $this->city,
            'clinicName' => $this->clinic_name,
            'avatarUrl' => $this->avatar_url,
            'bio' => $this->bio,
            'qualifications' => $this->qualifications ?? [],
            'specializations' => $this->specializations ?? [],
            'nextAvailableAt' => $this->next_available_at ?? now()->addHours(2)->toISOString(),
            'isAvailable' => (bool) $this->is_available,
            'searchText' => $this->search_text ?? '',
        ];
    }

    public function slots()
    {
        return $this->hasMany(TimeSlot::class, 'doctor_id', 'id');
    }
}
