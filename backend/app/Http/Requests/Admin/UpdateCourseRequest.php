<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $course = $this->route('course');

        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'thumbnail' => ['nullable', 'string', 'max:255'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'slug' => [
                'sometimes',
                'string',
                Rule::unique('courses', 'slug')->ignore($course),
            ],
            'is_published' => ['sometimes', 'boolean'],
            'level' => ['sometimes', 'string', 'in:Beginner,Intermediate,Advanced'],
        ];
    }
}
