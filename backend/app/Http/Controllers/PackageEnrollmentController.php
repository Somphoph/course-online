<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchasePackageRequest;
use App\Http\Resources\PackageEnrollmentResource;
use App\Models\Course;
use App\Models\Package;
use App\Models\PackageEnrollment;
use App\Models\PackagePayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PackageEnrollmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $packageEnrollments = PackageEnrollment::query()
            ->with(['package.courses', 'user'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'data' => PackageEnrollmentResource::collection($packageEnrollments),
        ]);
    }

    public function store(PurchasePackageRequest $request, Package $package): JsonResponse
    {
        abort_unless($package->is_published, 404);

        $package->load('courses');

        $alreadyEnrolledCourses = Course::query()
            ->whereIn('id', $package->courses->pluck('id'))
            ->whereHas('enrollments', function ($query) use ($request): void {
                $query->where('user_id', $request->user()->id)
                    ->where('status', 'approved');
            })
            ->get();

        $packageEnrollment = DB::transaction(function () use ($request, $package): PackageEnrollment {
            $slipPath = $request->file('slip_image')->store('slips', 'local');

            $packageEnrollment = PackageEnrollment::create([
                'user_id' => $request->user()->id,
                'package_id' => $package->id,
                'status' => 'pending',
                'slip_image_path' => $slipPath,
            ]);

            PackagePayment::create([
                'package_enrollment_id' => $packageEnrollment->id,
                'user_id' => $request->user()->id,
                'package_id' => $package->id,
                'amount' => $package->price,
                'currency' => 'THB',
                'provider' => 'manual',
                'status' => 'pending',
            ]);

            return $packageEnrollment;
        });

        return response()->json([
            'package_enrollment' => new PackageEnrollmentResource($packageEnrollment->load(['package.courses', 'user'])),
            'already_enrolled_courses' => $alreadyEnrolledCourses->map(fn (Course $course): array => [
                'id' => $course->id,
                'title' => $course->title,
            ])->values(),
        ], 201);
    }
}
