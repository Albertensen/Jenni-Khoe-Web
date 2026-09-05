<?php

namespace App\Http\Controllers;

use App\Models\PortfolioItem;
use Illuminate\Http\Request;

class PortfolioUploadController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'undertone' => 'nullable|string|max:50',
            'venue' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,webp|max:10240',
            'is_highlighted' => 'boolean',
        ]);

        $data = $request->only(['title', 'undertone', 'venue']);
        $data['is_highlighted'] = $request->boolean('is_highlighted');

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('portfolio', 'public');
            $data['image_path'] = $path;
        }

        $item = PortfolioItem::create($data);

        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function destroy($id)
    {
        $item = PortfolioItem::findOrFail($id);
        if ($item->image_path) {
            \Storage::disk('public')->delete($item->image_path);
        }
        $item->delete();
        return response()->json(['success' => true]);
    }

    public function reorder(Request $request)
    {
        $request->validate(['order' => 'required|array']);
        foreach ($request->order as $i => $id) {
            PortfolioItem::where('id', $id)->update(['sort_order' => $i]);
        }
        return response()->json(['success' => true]);
    }
}
