<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'name', 'brand', 'category', 'form', 'price', 'mrp',
        'rating', 'review_count', 'stock', 'tags', 'ingredients',
        'description', 'image_url', 'in_stock', 'search_text',
    ];

    protected $casts = [
        'price' => 'integer',
        'mrp' => 'integer',
        'rating' => 'float',
        'review_count' => 'integer',
        'stock' => 'integer',
        'tags' => 'array',
        'ingredients' => 'array',
        'in_stock' => 'boolean',
    ];

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'brand' => $this->brand,
            'category' => $this->category,
            'form' => $this->form,
            'price' => (int) $this->price,
            'mrp' => (int) $this->mrp,
            'rating' => (float) $this->rating,
            'reviewCount' => (int) $this->review_count,
            'stock' => (int) $this->stock,
            'tags' => $this->tags ?? [],
            'ingredients' => $this->ingredients ?? [],
            'description' => $this->description ?? '',
            'imageUrl' => $this->image_url ?? '',
            'inStock' => (bool) $this->in_stock,
            'searchText' => $this->search_text ?? '',
        ];
    }
}
