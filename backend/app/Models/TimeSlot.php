<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimeSlot extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'doctor_id', 'start', 'end', 'is_booked',
    ];

    protected $casts = [
        'is_booked' => 'boolean',
    ];

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'doctorId' => $this->doctor_id,
            'start' => $this->start,
            'end' => $this->end,
            'isBooked' => (bool) $this->is_booked,
        ];
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class, 'doctor_id', 'id');
    }
}
