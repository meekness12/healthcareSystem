<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $otpCode,
        public int $expiresInMinutes = 10
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Password Reset Verification Code (' . $this->otpCode . ') — Healthcare System Rwanda',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password_reset_otp',
        );
    }
}
