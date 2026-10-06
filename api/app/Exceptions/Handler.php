<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        // Nothing raw ever reaches the screen. Every API failure answers with a
        // sentence the user can act on: the first rule that failed when the data
        // was rejected, a plain description for the HTTP errors the proxy or the
        // browser can produce, and one honest generic sentence for anything
        // unexpected (a file PHP could not read, a timeout, a bug), which is
        // logged with its real class so it can be found in the log.
        $this->renderable(function (Throwable $e, Request $request) {
            // Only the requests that ask for JSON, which is what the app does
            // with its Accept header. A plain form from a browser keeps
            // Laravel's own behaviour (go back with the errors in the session).
            if (! $request->expectsJson()) {
                return null;
            }

            $status = $this->statusFor($e);

            if ($status >= 500) {
                Log::error('API: ' . $e::class . ' - ' . $e->getMessage(), [
                    'url' => $request->fullUrl(),
                ]);
            }

            $payload = ['error' => $this->friendlyMessage($e, $status)];

            if ($e instanceof ValidationException) {
                // Kept the way Laravel sends it, so field level errors still work.
                $payload['errors'] = $e->errors();
                $payload['message'] = $e->getMessage();
            }

            return response()->json($payload, $status);
        });
    }

    private function statusFor(Throwable $e): int
    {
        return match (true) {
            $e instanceof ValidationException => 422,
            $e instanceof AuthenticationException => 401,
            $e instanceof HttpExceptionInterface => $e->getStatusCode(),
            default => 500,
        };
    }

    private function friendlyMessage(Throwable $e, int $status): string
    {
        if ($e instanceof ValidationException) {
            return collect($e->errors())->flatten()->first() ?: 'Some of the data sent is not valid.';
        }

        if ($e instanceof HttpExceptionInterface) {
            return match ($status) {
                401 => 'Your session has expired. Log in again.',
                403 => 'You do not have permission to do this.',
                404 => 'Not found.',
                413 => 'That file is bigger than the server accepts. Split the export and try again.',
                419 => 'Your session has expired. Log in again.',
                429 => 'Too many attempts. Wait a moment and try again.',
                default => 'The request could not be processed (' . $status . ').',
            };
        }

        if ($status === 401) {
            return 'Your session has expired. Log in again.';
        }

        return 'Something went wrong and nothing was saved. Try again; if it keeps happening, tell us with this file.';
    }
}
