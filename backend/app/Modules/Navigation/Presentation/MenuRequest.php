<?php

namespace App\Modules\Navigation\Presentation;

use App\Modules\Access\Application\AccessQuery;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class MenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && app(AccessQuery::class)->allows($this->user(), 'menus'.'.'.($this->route('id') ? 'update' : 'create'));
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name' => ['required', 'regex:/^[a-z][a-z0-9_-]*$/', 'max:100', Rule::notIn(['home', 'profile', 'login', 'root', '403', '404', '500', 'not-found', 'iframe-page']), Rule::unique('menus')->ignore($id)],
            'title' => 'required|string|max:100',
            'path' => ['required', 'regex:~^/[a-z][a-z0-9/_-]*$~', 'max:200', Rule::notIn(['/home', '/profile', '/login', '/403', '/404', '/500', '/iframe-page']), Rule::unique('menus')->ignore($id)],
            'component' => ['required', Rule::in(['group', 'users', 'roles', 'permissions', 'menus'])],
            'parent_id' => 'nullable|integer|exists:menus,id', 'permission' => 'nullable|string|exists:permissions,name',
            'icon' => 'required|string|max:100', 'sort' => 'required|integer|min:0|max:10000', 'enabled' => 'required|boolean', 'version' => 'required|integer|min:0',
        ];
    }
}
