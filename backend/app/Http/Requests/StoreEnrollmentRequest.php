<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Rule;

class StoreEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'course_id' => [
                'required',
                'integer',
                Rule::exists('courses', 'id')->where(fn ($query) => $query->where('is_published', true)),
            ],
            'payment_method' => ['nullable', Rule::in(['manual', 'promptpay'])],
            'slip_image' => [
                Rule::requiredIf($this->input('payment_method', 'manual') === 'manual'),
                File::image()->max(2048),
            ],
        ];
    }
}
