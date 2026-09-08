<?php

namespace App\Modules\Access\Presentation;

use App\Modules\Access\Application\AccessQuery;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class AccessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && app(AccessQuery::class)->allows($this->user(), (string) $this->route('resource').'.'.($this->route('id') ? 'update' : 'create'));
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $id = $this->route('id');
        $resource = (string) $this->route('resource');

        return [
            'name' => ['required', 'string', 'max:100', 'regex:/^[a-z][a-z0-9_.-]*$/', Rule::unique($resource, 'name')->ignore($id)],
            'version' => 'required|integer|min:0',
            'permissionIds' => ($resource === 'roles' ? 'present' : 'sometimes').'|array|max:500',
            'permissionIds.*' => 'integer|distinct',
        ];
    }
}
