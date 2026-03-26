<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseBundleRequest;
use App\Http\Resources\BundleEnrollmentResource;
use App\Models\Course;
use App\Models\Bundle;
use App\Models\BundleEnrollment;
use App\Models\BundlePayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BundleEnrollmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $bundleEnrollments = BundleEnrollment::query()
            ->with(['bundle.courses', 'user'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'data' => BundleEnrollmentResource::collection($bundleEnrollments),
        ]);
    }

    public function store(PurchaseBundleRequest $request, Bundle $bundle): JsonResponse
    {
        abort_unless($bundle->is_published, 404);

        $bundle->load('courses');

        $alreadyEnrolledCourses = Course::query()
            ->whereIn('id', $bundle->courses->pluck('id'))
            ->whereHas('enrollments', function ($query) use ($request): void {
                $query->where('user_id', $request->user()->id)
                    ->where('status', 'approved');
            })
            ->get();

        $bundleEnrollment = DB::transaction(function () use ($request, $bundle): BundleEnrollment {
            $slipPath = $request->file('slip_image')->store('slips', 'local');

            $bundleEnrollment = BundleEnrollment::create([
                'user_id' => $request->user()->id,
                'package_id' => $bundle->id,
                'status' => 'pending',
                'slip_image_path' => $slipPath,
            ]);

            BundlePayment::create([
                'package_enrollment_id' => $bundleEnrollment->id,
                'user_id' => $request->user()->id,
                'package_id' => $bundle->id,
                'amount' => $bundle->price,
                'currency' => 'THB',
                'provider' => 'manual',
                'status' => 'pending',
            ]);

            return $bundleEnrollment;
        });

        return response()->json([
            'bundle_enrollment' => new BundleEnrollmentResource($bundleEnrollment->load(['bundle.courses', 'user'])),
            'already_enrolled_courses' => $alreadyEnrolledCourses->map(fn (Course $course): array => [
                'id' => $course->id,
                'title' => $course->title,
            ])->values(),
        ], 201);
    }
}
