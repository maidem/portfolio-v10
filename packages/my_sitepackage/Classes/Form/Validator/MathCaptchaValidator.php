<?php

declare(strict_types=1);

namespace Gripsraum\MySitepackage\Form\Validator;

use TYPO3\CMS\Extbase\Validation\Validator\AbstractValidator;

/**
 * Validates the user's answer against the math captcha stored in the session.
 *
 * The expected answer is written to the session by MathCaptcha form element.
 * The session key is derived from the form identifier passed as validator option.
 */
class MathCaptchaValidator extends AbstractValidator
{
    protected $supportedOptions = [
        'formIdentifier' => ['contact', 'The identifier of the parent form', 'string'],
    ];

    protected function isValid(mixed $value): void
    {
        $request = $GLOBALS['TYPO3_REQUEST'] ?? null;
        $frontendUser = $request?->getAttribute('frontend.user');

        if ($frontendUser === null) {
            $this->addError('Validierung fehlgeschlagen.', 1711642200);
            return;
        }

        $sessionKey = 'mathCaptcha_' . $this->options['formIdentifier'] . '_answer';
        $expectedAnswer = $frontendUser->getKey('ses', $sessionKey);

        if ($expectedAnswer === null || (int)$value !== (int)$expectedAnswer) {
            $this->addError('Die Antwort ist leider falsch. Bitte versuche es erneut.', 1711642201);
        }
    }
}
