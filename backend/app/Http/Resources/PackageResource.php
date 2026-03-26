<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PackageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $courses = $this->relationLoaded('courses') ? $this->courses : collect();
        $individualTotalPrice = $courses->sum(fn ($course) => (float) $course->price);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'thumbnail' => $this->thumbnail,
            'price' => $this->price,
            'individual_total_price' => round($individualTotalPrice, 2),
            'savings' => round($individualTotalPrice - (float) $this->price, 2),
            'is_published' => $this->is_published,
            'courses' => CourseResource::collection($courses),
        ];
    }
}
