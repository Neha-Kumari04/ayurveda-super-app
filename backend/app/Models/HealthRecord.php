<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HealthRecord extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'user_id', 'type', 'title', 'description',
        'date', 'provider', 'tags', 'attachments', 'meta', 'search_text',
    ];

    protected $casts = [
        'tags' => 'array',
        'attachments' => 'array',
        'meta' => 'array',
    ];

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description ?? '',
            'date' => $this->date,
            'provider' => $this->provider,
            'tags' => $this->tags ?? [],
            'attachments' => $this->attachments ?? [],
            'meta' => $this->meta ?? (object)[],
            'searchText' => $this->search_text ?? '',
        ];
    }
}
