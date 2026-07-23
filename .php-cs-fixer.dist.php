<?php

$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__)
    ->exclude(['vendor', 'node_modules'])
    ->name('*.php')
    ->notName('index.php');

return (new PhpCsFixer\Config())
    ->setRules([
        'align_multiline_comment' => true,
        'blank_line_after_opening_tag' => true,
        'line_ending' => true,
    ])
    ->setFinder($finder)
    ->setUsingCache(false);
