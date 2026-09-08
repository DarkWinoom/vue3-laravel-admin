<?php

namespace App\Modules\Identity\Presentation;

use App\Modules\Access\Application\AccessQuery;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && app(AccessQuery::class)->allows($this->user(), 'users'.'.'.($this->route('id') ? 'update' : 'create'));
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name' => 'required|string|max:100', 'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($id)],
            'password' => ($id ? 'nullable' : 'required').'|string|min:12|max:128', 'enabled' => 'required|boolean',
            'roleIds' => 'sometimes|array|max:100', 'roleIds.*' => 'integer|distinct', 'version' => 'required|integer|min:0',
        ];
    }
}
