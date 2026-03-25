<?php

namespace App\Http\Controllers;

use App\Http\Resources\EnrollmentResource;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $enrollments = Enrollment::with(['course', 'payment'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'data' => EnrollmentResource::collection($enrollments),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'slip_image' => ['required', 'image', 'max:2048'],
        ]);

        $course = Course::findOrFail($data['course_id']);
        $slipPath = $request->file('slip_image')->store('slips', 'local');

        $enrollment = Enrollment::create([
            'user_id' => $request->user()->id,
            'course_id' => $course->id,
            'status' => 'pending',
            'slip_image_path' => $slipPath,
        ]);

        Payment::create([
            'enrollment_id' => $enrollment->id,
            'user_id' => $request->user()->id,
            'course_id' => $course->id,
            'amount' => $course->price,
            'currency' => 'THB',
            'provider' => 'manual',
            'status' => 'pending',
        ]);

        return response()->json([
            'data' => new EnrollmentResource($enrollment->load(['course'])),
        ], 201);
    }
}
