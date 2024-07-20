<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

function hexToRgb(string $hex): array{
    $result = [];
    if(!preg_match("/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i", $hex, $result)){
        return null;
    }
    return [
        "r" => intval($result[1], 16),
        "g" => intval($result[2], 16),
        "b" => intval($result[3], 16)
    ];
}

function textColorOnBackground(string $hex): string{
    $hex = preg_replace("/^.*([0-9a-f]{6}).*$/", "$1", $hex);
    return ((hexToRgb($hex)["r"] * 0.299 + hexToRgb($hex)["g"] * 0.587 + hexToRgb($hex)["b"] * 0.114) > 130.0) ? "black" : "white";
}