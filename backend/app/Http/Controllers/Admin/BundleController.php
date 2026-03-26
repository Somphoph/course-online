<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AddBundleCourseRequest;
use App\Http\Requests\Admin\StoreBundleRequest;
use App\Http\Requests\Admin\UpdateBundleRequest;
use App\Http\Resources\BundleResource;
use App\Models\Course;
use App\Models\Bundle;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class BundleController extends Controller
{
    public function index(): JsonResponse
    {
        $bundles = Bundle::query()
            ->with('courses')
            ->latest()
            ->get();

        return response()->json([
            'data' => BundleResource::collection($bundles),
        ]);
    }

    public function store(StoreBundleRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (! empty($data['is_published'])) {
            return response()->json([
                'message' => 'Bundle must have at least one course before publishing.',
            ], 422);
        }

        $bundle = Bundle::create($data);

        return response()->json([
            'data' => new BundleResource($bundle->load('courses')),
        ], 201);
    }

    public function update(UpdateBundleRequest $request, Bundle $bundle): JsonResponse
    {
        $data = $request->validated();

        if (array_key_exists('is_published', $data) && $data['is_published'] && $bundle->courses()->count() === 0) {
            return response()->json([
                'message' => 'Bundle must have at least one course before publishing.',
            ], 422);
        }

        $bundle->update($data);

        return response()->json([
            'data' => new BundleResource($bundle->fresh()->load('courses')),
        ]);
    }

    public function destroy(Bundle $bundle): JsonResponse|Response
    {
        $hasActiveEnrollments = $bundle->bundleEnrollments()
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($hasActiveEnrollments) {
            return response()->json([
                'message' => 'Cannot delete bundle with active enrollments.',
            ], 422);
        }

        $bundle->delete();

        return response()->noContent();
    }

    public function addCourse(AddBundleCourseRequest $request, Bundle $bundle): JsonResponse
    {
        $data = $request->validated();

        $bundle->courses()->syncWithoutDetaching([$data['course_id']]);

        return response()->json([
            'data' => new BundleResource($bundle->fresh()->load('courses')),
        ]);
    }

    public function removeCourse(Bundle $bundle, Course $course): JsonResponse|Response
    {
        $hasPendingEnrollments = $bundle->bundleEnrollments()
            ->where('status', 'pending')
            ->exists();

        if ($hasPendingEnrollments) {
            return response()->json([
                'message' => 'Cannot remove course from bundle with pending enrollments.',
            ], 422);
        }

        $bundle->courses()->detach($course->id);

        return response()->noContent();
    }
}
