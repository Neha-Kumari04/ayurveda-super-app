<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Adjust users table to support string id & avatar_url
        Schema::dropIfExists('users');
        Schema::create('users', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('avatar_url')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // Doctors table
        Schema::create('doctors', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('specialty');
            $table->integer('experience_years');
            $table->decimal('rating', 3, 2)->default(4.5);
            $table->integer('review_count')->default(0);
            $table->integer('fee')->default(500);
            $table->string('gender')->default('male');
            $table->json('languages')->nullable();
            $table->string('city');
            $table->string('clinic_name');
            $table->string('avatar_url')->nullable();
            $table->text('bio')->nullable();
            $table->json('qualifications')->nullable();
            $table->json('specializations')->nullable();
            $table->string('next_available_at')->nullable();
            $table->boolean('is_available')->default(true);
            $table->text('search_text')->nullable();
            $table->timestamps();
        });

        // Time slots table
        Schema::create('time_slots', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('doctor_id')->index();
            $table->string('start');
            $table->string('end');
            $table->boolean('is_booked')->default(false);
            $table->timestamps();
        });

        // Bookings table
        Schema::create('bookings', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('user_id')->nullable()->index();
            $table->string('doctor_id')->index();
            $table->string('doctor_name');
            $table->string('specialty');
            $table->string('start');
            $table->string('end');
            $table->integer('fee');
            $table->string('status')->default('confirmed');
            $table->string('reason')->nullable();
            $table->string('cancelled_at')->nullable();
            $table->string('cancel_reason')->nullable();
            $table->timestamps();
        });

        // Products table
        Schema::create('products', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('brand');
            $table->string('category');
            $table->string('form');
            $table->integer('price');
            $table->integer('mrp');
            $table->decimal('rating', 3, 2)->default(4.5);
            $table->integer('review_count')->default(0);
            $table->integer('stock')->default(100);
            $table->json('tags')->nullable();
            $table->json('ingredients')->nullable();
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('in_stock')->default(true);
            $table->text('search_text')->nullable();
            $table->timestamps();
        });

        // Health Records table
        Schema::create('health_records', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('user_id')->nullable()->index();
            $table->string('type');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('date');
            $table->string('provider');
            $table->json('tags')->nullable();
            $table->json('attachments')->nullable();
            $table->json('meta')->nullable();
            $table->text('search_text')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_records');
        Schema::dropIfExists('products');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('time_slots');
        Schema::dropIfExists('doctors');
        Schema::dropIfExists('users');
    }
};
