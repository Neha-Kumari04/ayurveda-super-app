<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'user_id', 'doctor_id', 'doctor_name', 'specialty',
        'start', 'end', 'fee', 'status', 'reason', 'cancelled_at', 'cancel_reason',
    ];

    protected $casts = [
        'fee' => 'integer',
    ];

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'doctorId' => $this->doctor_id,
            'doctorName' => $this->doctor_name,
            'specialty' => $this->specialty,
            'start' => $this->start,
            'end' => $this->end,
            'fee' => (int) $this->fee,
            'status' => $this->status,
            'reason' => $this->reason,
            'createdAt' => $this->created_at ? $this->created_at->toISOString() : now()->toISOString(),
            'cancelledAt' => $this->cancelled_at,
            'cancelReason' => $this->cancel_reason,
        ];
    }
}
