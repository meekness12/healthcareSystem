<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'target_table',
        'target_id',
        'ip_address',
        'details',
    ];

    protected $casts = [
        'details' => 'array',
        'target_id' => 'integer',
        'user_id' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Record an audit log entry conveniently
     */
    public static function record(
        string $action,
        ?string $targetTable = null,
        ?int $targetId = null,
        ?array $details = null,
        ?int $userId = null,
        ?string $ip = null
    ): self {
        return static::create([
            'action' => strtoupper($action),
            'target_table' => $targetTable,
            'target_id' => $targetId,
            'details' => $details,
            'user_id' => $userId ?? (auth()->check() ? auth()->id() : null),
            'ip_address' => $ip ?? (request() ? request()->ip() : null),
        ]);
    }

    public function scopeAction(Builder $query, ?string $action): Builder
    {
        if ($action && $action !== 'all') {
            return $query->where('action', $action);
        }
        return $query;
    }

    public function scopeUser(Builder $query, ?int $userId): Builder
    {
        if ($userId) {
            return $query->where('user_id', $userId);
        }
        return $query;
    }

    public function scopeTarget(Builder $query, ?string $table): Builder
    {
        if ($table && $table !== 'all') {
            return $query->where('target_table', $table);
        }
        return $query;
    }

    public function scopeDateRange(Builder $query, ?string $from, ?string $to): Builder
    {
        if ($from) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('created_at', '<=', $to);
        }
        return $query;
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (!$term) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('action', 'like', "%{$term}%")
              ->orWhere('target_table', 'like', "%{$term}%")
              ->orWhere('ip_address', 'like', "%{$term}%")
              ->orWhereHas('user', function (Builder $uQ) use ($term) {
                  $uQ->where('name', 'like', "%{$term}%")
                     ->orWhere('email', 'like', "%{$term}%");
              });
        });
    }
}
