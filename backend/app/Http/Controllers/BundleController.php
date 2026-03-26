<?php

namespace App\Http\Controllers;

use App\Http\Resources\BundleResource;
use App\Models\Bundle;
use Illuminate\Http\JsonResponse;

class BundleController extends Controller
{
    public function index(): JsonResponse
    {
        $bundles = Bundle::query()
            ->published()
            ->with('courses')
            ->latest()
            ->get();

        return response()->json([
            'data' => BundleResource::collection($bundles),
        ]);
    }

    public function show(Bundle $bundle): JsonResponse
    {
        abort_unless($bundle->is_published, 404);

        $bundle->load('courses');

        return response()->json([
            'data' => new BundleResource($bundle),
        ]);
    }
}
