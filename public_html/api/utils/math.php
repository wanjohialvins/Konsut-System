<?php
// backend/utils/math.php

/**
 * Standardize financial rounding (Banker's Rounding / Half Even)
 * Ensures consistency across the application.
 */
function bankersRound($number, $precision = 2)
{
    // casting to float is important
    return round((float) $number, $precision, PHP_ROUND_HALF_EVEN);
}

/**
 * Validate Date Format (ISO YYYY-MM-DD)
 */
function isValidDate($date)
{
    if (!$date)
        return false;
    // Simple Regex for YYYY-MM-DD
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date))
        return false;

    // Check logical existence (e.g. not 2023-02-31)
    [$year, $month, $day] = explode('-', $date);
    if (!checkdate((int) $month, (int) $day, (int) $year))
        return false;

    // Range Check (Year 2000 - 2100)
    if ($year < 2000 || $year > 2100)
        return false;

    return true;
}
