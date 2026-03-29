<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'thumbnail' => ['nullable', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'slug' => ['required', 'string', 'unique:courses,slug'],
            'is_published' => ['boolean'],
            'level' => ['required', 'string', 'in:Beginner,Intermediate,Advanced'],
        ];
    }
}
