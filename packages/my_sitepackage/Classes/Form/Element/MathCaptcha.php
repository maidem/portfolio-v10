<?php

declare(strict_types=1);

namespace Gripsraum\MySitepackage\Form\Element;

use TYPO3\CMS\Form\Domain\Model\FormElements\GenericFormElement;

class MathCaptcha extends GenericFormElement
{
    public function initializeFormElement(): void
    {
        parent::initializeFormElement();
    }

    public function setOptions(array $options, bool $resetValidators = false): void
    {
        parent::setOptions($options, $resetValidators);

        $request = $GLOBALS['TYPO3_REQUEST'] ?? null;
        if ($request === null) {
            return;
        }

        $frontendUser = $request->getAttribute('frontend.user');
        if ($frontendUser === null) {
            return;
        }

        $sessionKey = 'mathCaptcha_' . $this->getRootForm()->getIdentifier();
        $isPost = strtoupper($request->getMethod()) === 'POST';

        if (!$isPost) {
            $a = random_int(1, 9);
            $b = random_int(1, 9);
            $frontendUser->setKey('ses', $sessionKey . '_answer', $a + $b);
            $frontendUser->setKey('ses', $sessionKey . '_label', sprintf('Was ist %d + %d?', $a, $b));
            $frontendUser->storeSessionData();
        }

        $label = $frontendUser->getKey('ses', $sessionKey . '_label');
        if (!empty($label)) {
            $this->setLabel($label);
        }
    }
}
