<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCourseRequest;
use App\Http\Requests\Admin\UpdateCourseRequest;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class CourseController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => CourseResource::collection(Course::latest()->get()),
        ]);
    }

    public function store(StoreCourseRequest $request): JsonResponse
    {
        $data = $request->validated();

        $course = Course::create($data);

        return response()->json([
            'data' => new CourseResource($course),
        ], 201);
    }

    public function update(UpdateCourseRequest $request, Course $course): JsonResponse
    {
        $data = $request->validated();

        $course->update($data);

        return response()->json([
            'data' => new CourseResource($course->fresh()),
        ]);
    }

    public function destroy(Course $course): Response
    {
        $course->delete();

        return response()->noContent();
    }
}
