<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

require_once($_SERVER['DOCUMENT_ROOT'] . '/include/qtranslator/qtranslator.php');

if(!defined('NO_LOGIN')){
    require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/database.php');
    require_once($_SERVER['DOCUMENT_ROOT'] . '/include/user/user.php');
}

//Returns the equivalent of $page (or the current page if $page is null) in a different language
function pageInLanguage(string $language, ?string $page = null): string{
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

//Returns $url with the appropriate /en, /fr or /sv in front of it depending on the current URL
function localizedUrl(string $url): string{
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

//Install the translator
$translator = new QTranslator();
$translator->load($_SERVER['DOCUMENT_ROOT'] . '/php-translations/mapcollector_php_' . LANGUAGE . '.ts');
QCoreApplication::installTranslator($translator);