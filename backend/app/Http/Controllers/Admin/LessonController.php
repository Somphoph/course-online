<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLessonRequest;
use App\Http\Requests\Admin\UpdateLessonRequest;
use App\Http\Resources\LessonResource;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class LessonController extends Controller
{
    public function index(Course $course): JsonResponse
    {
        return response()->json([
            'data' => LessonResource::collection($course->lessons()->get()),
        ]);
    }

    public function store(StoreLessonRequest $request, Course $course): JsonResponse
    {
        $data = $request->validated();

        $lesson = $course->lessons()->create($data);

        return response()->json([
            'data' => new LessonResource($lesson),
        ], 201);
    }

    public function update(UpdateLessonRequest $request, Lesson $lesson): JsonResponse
    {
        $data = $request->validated();

        $lesson->update($data);

        return response()->json([
            'data' => new LessonResource($lesson->fresh()),
        ]);
    }

    public function destroy(Lesson $lesson): Response
    {
        $lesson->delete();

        return response()->noContent();
    }
}
