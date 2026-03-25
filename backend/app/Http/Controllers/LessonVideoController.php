<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Lesson;
use App\Services\BunnyVideoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonVideoController extends Controller
{
    public function show(Request $request, Lesson $lesson, BunnyVideoService $bunnyVideoService): JsonResponse
    {
        $hasApprovedEnrollment = Enrollment::query()
            ->where('user_id', $request->user()->id)
            ->where('course_id', $lesson->course_id)
            ->where('status', 'approved')
            ->exists();

        abort_unless($hasApprovedEnrollment, 403);

        return response()->json([
            'lesson_id' => $lesson->id,
            'video_id' => $lesson->bunny_video_id,
            'signed_url' => $bunnyVideoService->generateSignedUrl($lesson->bunny_video_id),
        ]);
    }
}
