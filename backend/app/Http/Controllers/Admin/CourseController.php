<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => CourseResource::collection(Course::latest()->get()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'thumbnail' => ['nullable', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'slug' => ['required', 'string', 'unique:courses,slug'],
            'is_published' => ['boolean'],
        ]);

        $course = Course::create($data);

        return response()->json([
            'data' => new CourseResource($course),
        ], 201);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'thumbnail' => ['nullable', 'string', 'max:255'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'slug' => ['sometimes', 'string', 'unique:courses,slug,' . $course->id],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        $course->update($data);

        return response()->json([
            'data' => new CourseResource($course->fresh()),
        ]);
    }

    public function destroy(Course $course): JsonResponse
    {
        $course->delete();

        return response()->json([], 204);
    }
}
