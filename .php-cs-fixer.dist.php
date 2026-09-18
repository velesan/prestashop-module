<?php
$config = new PrestaShop\CodingStandards\CsFixer\Config();

// The Addons "Standards" check (php-cs-fixer/@Symfony) wants a blank line
// after <?php, but the separate "Licenses" check requires NO blank line
// before the file's license comment - the two conflict, and Licenses takes
// priority (it fails the whole submission, Standards is only a warning).
$config->setRules(array_merge($config->getRules(), [
    'blank_line_after_opening_tag' => false,
]));

/** @var \Symfony\Component\Finder\Finder $finder */
$finder = $config->setUsingCache(true)->getFinder();
$finder->in(__DIR__)->exclude('vendor');

return $config;
