<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEnrollmentRequest;
use App\Http\Resources\EnrollmentResource;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

    public function store(StoreEnrollmentRequest $request): JsonResponse
    {
        $data = $request->validated();

        $course = Course::query()->published()->findOrFail($data['course_id']);

        $alreadyEnrolled = Enrollment::query()
            ->where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->whereNull('package_enrollment_id')
            ->exists();

        if ($alreadyEnrolled) {
            return response()->json([
                'message' => 'You are already enrolled in this course.',
            ], 422);
        }

        $slipPath = $request->file('slip_image')->store('slips', 'local');

        $enrollment = DB::transaction(function () use ($request, $course, $slipPath): Enrollment {
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

            return $enrollment;
        });

        return response()->json([
            'data' => new EnrollmentResource($enrollment->load(['course'])),
        ], 201);
    }
}
