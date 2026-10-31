<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/vendor/autoload.php');

if(!defined('NO_LOGIN')){
    require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/database.php');
    require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');
}

/**
 * Returns the equivalent of $page (or the current page if $page is null) in a different language.
 *
 * @param $language The language of the page to link to.
 * @param $page     The url to localize (for example `/foo.php`).
 *
 * @return The localized url (for example `/fr/foo.php`).
 */
function pageInLanguage(string $language, ?string $page = null): string {
    $page = ($page === null) ? $_SERVER['REQUEST_URI'] : $page;
    if(!preg_match('/^(en|fr|sv)?$/', $language)){
        throw new Exception("Language not supported: $language");
    }
    $urlPrefix = '/';
    if($language !== ''){
        $urlPrefix .= "$language/";
    }
    return preg_replace(
        ['/https?:\/+[^\/]+/', '/^\/((en|fr|sv)(\/|$))?/', '/\/\//'],
        ['', $urlPrefix, '/'],
        $page
    );
}

/**
 * Returns $url with the appropriate /en, /fr or /sv in front of it depending on the current URL.
 *
 * @param $url  The plain url (for example `/foo.php`).
 *
 * @return The localized url (for example `/fr/foo.php` if the page that's currently open is `/fr/bar.php`).
 */
function localizedUrl(string $url): string {
    if(preg_match('/^(https?:\/*)?[^\/]*\/en(\/|$|\?)/', $_SERVER['REQUEST_URI'])){
        return pageInLanguage('en', $url);
    }
    else if(preg_match('/^(https?:\/*)?[^\/]*\/fr(\/|$|\?)/', $_SERVER['REQUEST_URI'])){
        return pageInLanguage('fr', $url);
    }
    else if(preg_match('/^(https?:\/*)?[^\/]*\/sv(\/|$|\?)/', $_SERVER['REQUEST_URI'])){
        return pageInLanguage('sv', $url);
    }
    return $url;
}

//Define the language
if(preg_match('/^\/(en|fr|sv)(\/|$|\?)/i', $_SERVER['REQUEST_URI'], $language)){
    define('LANGUAGE', $language[1]);
}
else{
    $user = defined('NO_LOGIN') ? null : LoggedInUser::userFromCookies();
    if($user !== null){
        define('LANGUAGE', $user->language());
    }
    else if(isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])){
        preg_match_all('/([a-z]{1,8})(-[a-z]{1,8})?\s*(;\s*q\s*=\s*(1|0\.[0-9]+))?/i', $_SERVER['HTTP_ACCEPT_LANGUAGE'], $userLanguages);
        foreach($userLanguages[1] as $language){
            if(in_array($language, ['en', 'fr', 'sv'])){
                define('LANGUAGE', $language);
                break;
            }
        }
    }
}
if(!defined('LANGUAGE')){
    define('LANGUAGE', 'en');
}

//Initialize the translator
$translator = new \Symfony\Component\Translation\Translator(LANGUAGE);
$translator->addLoader('json', new \Symfony\Component\Translation\Loader\JsonFileLoader());
$translator->addResource('json', $_SERVER['DOCUMENT_ROOT'] . '/locale/' . LANGUAGE . '.icu.json', LANGUAGE, 'messages+intl-icu');

/**
 * Gets the translator. Useful so that we don't have to use `global` in every function.
 *
 * @return The translator.
 */
function translator(): \Symfony\Component\Translation\Translator {
    global $translator;
    return $translator;
}
