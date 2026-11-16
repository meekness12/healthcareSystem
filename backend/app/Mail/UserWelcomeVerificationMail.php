<?php

namespace App\Mail;

use App\Models\User;
use App\Models\Patient;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserWelcomeVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public ?Patient $patient,
        public string $otpCode,
        public int $expiresInMinutes = 15
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to Healthcare System Rwanda — Verify Your Account (Code: ' . $this->otpCode . ')',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.welcome_verification',
        );
    }
}
