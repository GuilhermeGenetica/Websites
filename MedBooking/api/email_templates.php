<?php
// api/email_templates.php

if (!function_exists('getAppointmentConfirmationEmailHtml')) {
    /**
     * Generates a professional HTML email body for appointment confirmations.
     *
     * @param string $patientName The full name of the patient.
     * @param string $doctorName The full name of the doctor.
     * @param string $appointmentDate Formatted appointment date (e.g., "10/12/2025").
     * @param string $appointmentTime Formatted appointment time (e.g., "14:30").
     * @param string $consultationType "online" or "in-person".
     * @param string|null $meetLink The Google Meet link, if available.
     * @return string The full HTML for the email body.
     */
    function getAppointmentConfirmationEmailHtml($patientName, $doctorName, $appointmentDate, $appointmentTime, $consultationType, $meetLink = null) {
        
        $emailTitle = "Appointment Confirmed!";
        $consultationTypeText = ucfirst($consultationType);
        $subjectLine = "Appointment Confirmation - MedBooking: Dr. $doctorName & $patientName";

        $locationHtml = '';
        if ($consultationType === 'online' && !empty($meetLink)) {
            $locationHtml = '
                <p style="font-size: 16px; line-height: 1.5; color: #333; margin-bottom: 25px;">
                    <strong>Consultation Link:</strong><br>
                    <a href="' . htmlspecialchars($meetLink) . '" style="color: #ffffff; background-color: #0d9488; padding: 10px 15px; border-radius: 5px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 5px;">
                        Access Video Call
                    </a>
                </p>';
        } else if ($consultationType === 'in-person') {
            $locationHtml = '
                <p style="font-size: 16px; line-height: 1.5; color: #333; margin-bottom: 25px; background-color: #f3f4f6; padding: 15px; border-radius: 5px;">
                    <strong>Consultation Location:</strong><br>
                    This is an in-person appointment. Please check the doctor\'s profile for the clinic address or contact them for confirmation.
                </p>';
        }

        return '
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>' . $subjectLine . '</title>
            <style>
                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                .container { width: 90%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
                .header { background: linear-gradient(135deg, #0d9488, #0d9488); padding: 40px; text-align: center; }
                .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; }
                .content { padding: 40px; }
                .content h2 { color: #0f172a; font-size: 22px; margin-top: 0; margin-bottom: 20px; }
                .content p { font-size: 16px; line-height: 1.5; color: #333; margin-bottom: 20px; }
                .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 25px; margin-bottom: 25px; }
                .details-box .detail-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
                .details-box .detail-item:last-child { border-bottom: none; }
                .details-box .detail-item strong { color: #0f172a; }
                .footer { background-color: #f1f5f9; padding: 40px; text-align: center; color: #64748b; font-size: 14px; }
                .footer p { margin: 0; line-height: 1.5; }
            </style>
        </head>
        <body style="background-color: #f1f5f9; padding: 20px;">
            <div class="container" style="width: 90%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                
                <div class="header" style="background: linear-gradient(135deg, #0d9488, #0d9488); padding: 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">MedBooking</h1>
                </div>
                
                <div class="content" style="padding: 40px;">
                    <h2 style="color: #0f172a; font-size: 22px; margin-top: 0; margin-bottom: 20px;">' . $emailTitle . '</h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #333; margin-bottom: 20px;">
                        Hello ' . htmlspecialchars($patientName) . ' and Dr. ' . htmlspecialchars($doctorName) . ',
                    </p>
                    <p style="font-size: 16px; line-height: 1.5; color: #333; margin-bottom: 25px;">
                        Your consultation has been successfully confirmed. Please review the details below.
                    </p>

                    <div class="details-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 25px; margin-bottom: 25px;">
                        <div class="detail-item" style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                            <span style="color: #64748b;">Patient:</span>
                            <strong style="color: #0f172a;">' . htmlspecialchars($patientName) . '</strong>
                        </div>
                        <div class="detail-item" style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                            <span style="color: #64748b;">Doctor:</span>
                            <strong style="color: #0f172a;">Dr. ' . htmlspecialchars($doctorName) . '</strong>
                        </div>
                        <div class="detail-item" style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                            <span style="color: #64748b;">Date:</span>
                            <strong style="color: #0f172a;">' . htmlspecialchars($appointmentDate) . '</strong>
                        </div>
                        <div class="detail-item" style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                            <span style="color: #64748b;">Time:</span>
                            <strong style="color: #0f172a;">' . htmlspecialchars($appointmentTime) . '</strong>
                        </div>
                        <div class="detail-item" style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: none;">
                            <span style="color: #64748b;">Type:</span>
                            <strong style="color: #0f172a;">' . htmlspecialchars($consultationTypeText) . '</strong>
                        </div>
                    </div>

                    ' . $locationHtml . '

                    <p style="font-size: 16px; line-height: 1.5; color: #333; margin-bottom: 20px;">
                        If you need to reschedule or cancel, please do so at least 24 hours in advance through the platform.
                    </p>
                    <p style="font-size: 16px; line-height: 1.5; color: #333; margin-bottom: 0;">
                        Best regards,<br>The MedBooking Team
                    </p>
                </div>
                
                <div class="footer" style="background-color: #f1f5f9; padding: 40px; text-align: center; color: #64748b; font-size: 14px;">
                    <p style="margin: 0; line-height: 1.5;">&copy; ' . date('Y') . ' MedBooking. All Rights Reserved.</p>
                    <p style="margin: 0; line-height: 1.5;">This is an automated message. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        ';
    }
}

if (!function_exists('getAppointmentCancellationEmailHtml')) {
    /**
     * Generates a professional HTML email body for appointment cancellations.
     *
     * @param string $patientName The full name of the patient.
     * @param string $doctorName The full name of the doctor.
     * @param string $appointmentDate Formatted appointment date (e.g., "10/12/2025").
     * @param string $appointmentTime Formatted appointment time (e.g., "14:30").
     * @param string $cancelledBy Who cancelled the appointment ("Doctor" or "Patient").
     * @return string The full HTML for the email body.
     */
    function getAppointmentCancellationEmailHtml($patientName, $doctorName, $appointmentDate, $appointmentTime, $cancelledBy) {
        
        $emailTitle = "Appointment Canceled";
        $subjectLine = "Appointment Cancellation - MedBooking: Dr. $doctorName & $patientName";

        $message = "The appointment between <strong>" . htmlspecialchars($patientName) . "</strong> and <strong>Dr. " . htmlspecialchars($doctorName) . "</strong> scheduled for <strong>" . htmlspecialchars($appointmentDate) . " at " . htmlspecialchars($appointmentTime) . "</strong> has been canceled by the " . htmlspecialchars($cancelledBy) . ".";
        
        $recipientMessage = '';
        if ($cancelledBy === 'Doctor') {
            $recipientMessage = "We apologize for any inconvenience. If you wish to reschedule, please visit the platform to find a new time.";
        } else {
            $recipientMessage = "We confirm your cancellation. If this was a mistake, please book a new appointment. Please check our refund policy if applicable.";
        }


        return '
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>' . $subjectLine . '</title>
            <style>
                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                .container { width: 90%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
                .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 40px; text-align: center; }
                .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; }
                .content { padding: 40px; }
                .content h2 { color: #0f172a; font-size: 22px; margin-top: 0; margin-bottom: 20px; }
                .content p { font-size: 16px; line-height: 1.5; color: #333; margin-bottom: 20px; }
                .details-box { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 5px; padding: 25px; margin-bottom: 25px; }
                .details-box .detail-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #fee2e2; }
                .details-box .detail-item:last-child { border-bottom: none; }
                .details-box .detail-item strong { color: #b91c1c; }
                .footer { background-color: #f1f5f9; padding: 40px; text-align: center; color: #64748b; font-size: 14px; }
                .footer p { margin: 0; line-height: 1.5; }
            </style>
        </head>
        <body style="background-color: #f1f5f9; padding: 20px;">
            <div class="container" style="width: 90%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                
                <div class="header" style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">MedBooking</h1>
                </div>
                
                <div class="content" style="padding: 40px;">
                    <h2 style="color: #0f172a; font-size: 22px; margin-top: 0; margin-bottom: 20px;">' . $emailTitle . '</h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #333; margin-bottom: 25px;">
                        ' . $message . '
                    </p>

                    <div class="details-box" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 5px; padding: 25px; margin-bottom: 25px;">
                        <div class="detail-item" style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #fee2e2;">
                            <span style="color: #64748b;">Patient:</span>
                            <strong style="color: #b91c1c;">' . htmlspecialchars($patientName) . '</strong>
                        </div>
                        <div class="detail-item" style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #fee2e2;">
                            <span style="color: #64748b;">Doctor:</span>
                            <strong style="color: #b91c1c;">Dr. ' . htmlspecialchars($doctorName) . '</strong>
                        </div>
                        <div class="detail-item" style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #fee2e2;">
                            <span style="color: #64748b;">Date:</span>
                            <strong style="color: #b91c1c;">' . htmlspecialchars($appointmentDate) . '</strong>
                        </div>
                        <div class="detail-item" style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: none;">
                            <span style="color: #64748b;">Time:</span>
                            <strong style="color: #b91c1c;">' . htmlspecialchars($appointmentTime) . '</strong>
                        </div>
                    </div>

                    <p style="font-size: 16px; line-height: 1.5; color: #333; margin-bottom: 20px;">
                        ' . $recipientMessage . '
                    </p>
                    <p style="font-size: 16px; line-height: 1.5; color: #333; margin-bottom: 0;">
                        Best regards,<br>The MedBooking Team
                    </p>
                </div>
                
                <div class="footer" style="background-color: #f1f5f9; padding: 40px; text-align: center; color: #64748b; font-size: 14px;">
                    <p style="margin: 0; line-height: 1.5;">&copy; ' . date('Y') . ' MedBooking. All Rights Reserved.</p>
                    <p style="margin: 0; line-height: 1.5;">This is an automated message. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        ';
    }
}
?>