<?php

namespace App\Http\Controllers;

use App\Http\Resources\CourseDetailResource;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => CourseResource::collection(Course::published()->latest()->get()),
        ]);
    }

    public function show(Request $request, Course $course): JsonResponse
    {
        abort_unless($course->is_published, 404);

        $course->load([
            'lessons' => fn ($query) => $request->user()
                ? $query
                : $query->where('is_preview', true),
        ]);

        return response()->json([
            'data' => new CourseDetailResource($course),
        ]);
    }
}
