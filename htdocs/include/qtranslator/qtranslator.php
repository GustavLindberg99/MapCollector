<?php

namespace QTranslator{
    class _Translation{
        public $sourceText;
        public $translation;
        public $disambiguation;
    }
}

namespace{
class QObject{
    protected static $_translators = [];

    public static function tr(string $sourceText, ?string $disambiguation = null, ?int $n = null): string{
        foreach(QObject::$_translators as $translator){
            $translation = $translator->translate("lupdate-php", $sourceText, $disambiguation, $n);
            if($translation !== $sourceText){
                return $translation;
            }
        }
        return str_replace("%n", $n, $sourceText);
    }

    public static function htr(string $sourceText, ?string $disambiguation = null, ?int $n = null): string{
        $tr = 'QObject::tr';    //So that lupdate-php doesn't try to translate the command below
        return htmlspecialchars($tr($sourceText, $disambiguation, $n));
    }
}

class QTranslator extends QObject{
    private $_filePath = "";
    private $_language = "";
    private $_translationsByContext = [];

    public function filePath(): string{
        return $this->_filePath;
    }

    public function isEmpty(): bool{
        return $this->_filePath === "";
    }

    public function language(): string{
        return $this->_language;
    }

    public function load(string $filePath): bool{
        $tsElement = simplexml_load_file($filePath);
        if($tsElement === false){
            return false;
        }
        if($tsElement->getName() !== "TS"){
            return false;
        }

        $translationsByContext = [];
        foreach($tsElement->children() as $contextElement){
            if($contextElement->getName() !== "context"){
                return false;
            }
            $contextName = (string)$contextElement->name;    //$contextElement->name selects the first <name> tag, then (string) gets the text inside the <name> tag.
            $translationsByContext[$contextName] = [];

            foreach($contextElement->children() as $messageElement){
                if($messageElement->getName() !== "message"){
                    continue;
                }
                if($messageElement->source[0] === null){
                    return false;
                }
                $translation = new QTranslator\_Translation();
                $translation->sourceText = (string)$messageElement->source;
                $translation->disambiguation = (string)$messageElement->comment;
                if($messageElement->attributes()["numerus"] == "yes"){    //This must be ==, not ===
                    $translation->translation = [];
                    foreach($messageElement->translation->children() as $numerusElement){
                        $translation->translation[] = (string)$numerusElement;
                    }
                }
                else{
                    $translation->translation = (string)$messageElement->translation;
                }
                $translationsByContext[$contextName][] = $translation;
            }
        }

        $language = $tsElement->attributes()["language"];
        if($this->plural(0) === null){
            return false;
        }

        $this->_filePath = $filePath;
        $this->_language = $language;
        $this->_translationsByContext = $translationsByContext;

        return true;
    }

    public function translate(string $context, string $sourceText, ?string $disambiguation = null, ?int $n = null): string{
        if(!array_key_exists($context, $this->_translationsByContext)){
            return $sourceText;
        }
        $translation = current(array_filter($this->_translationsByContext[$context], function(QTranslator\_Translation $it) use($sourceText, $disambiguation, $n): bool{
            return $it->sourceText === $sourceText
                   && $it->disambiguation === ($disambiguation ?? "")
                   && ($n === null ? is_string($it->translation) : is_array($it->translation));
        }));
        if($translation === false || $translation->translation === ""){
            if($n !== null){
                return str_replace("%n", $n, $sourceText);
            }
            else{
                return $sourceText;
            }
        }
        else if($n === null){
            return $translation->translation;
        }
        else{
            $plural = min($this->plural($n), sizeof($translation->translation) - 1);
            $result = str_replace("%n", $n, $translation->translation[$plural]);
            if($result === ""){
                return str_replace("%n", $n, $sourceText);
            }
            else{
                return $result;
            }
        }
    }

    private function plural(int $n): ?int{
        switch(explode("_", $this->language())[0]){
        case "aa":    //Afar
        case "ab":    //Abkhazian
        case "af":    //Afrikaans
        case "am":    //Amharic
        case "as":    //Assamese
        case "az":    //Azerbaijani
        case "ba":    //Bashkir
        case "bg":    //Bulgarian
        case "bn":    //Bangla
        case "ca":    //Catalan
        case "co":    //Corsican
        case "da":    //Danish
        case "de":    //German
        case "el":    //Greek
        case "en":    //English
        case "eo":    //Esperanto
        case "es":    //Spanish
        case "et":    //Estonian
        case "eu":    //Basque
        case "fi":    //Finnish
        case "fo":    //Faroese
        case "fur":   //Friulian
        case "fy":    //Western Frisian
        case "gl":    //Galician
        case "gu":    //Gujarati
        case "ha":    //Hausa
        case "he":    //Hebrew
        case "hi":    //Hindi
        case "ia":    //Interlingua
        case "it":    //Italian
        case "ka":    //Georgian
        case "kk":    //Kazakh
        case "kl":    //Kalaallisut
        case "kn":    //Kannada
        case "ks":    //Kashmiri
        case "ku":    //Kurdish
        case "kw":    //Cornish
        case "ky":    //Kyrgyz
        case "la":    //Latin
        case "lb":    //Luxembourgish
        case "ln":    //Lingala
        case "lo":    //Lao
        case "mg":    //Malagasy
        case "ml":    //Malayalam
        case "mn":    //Mongolian
        case "mr":    //Marathi
        case "nb":    //Norwegian Bokmal
        case "ne":    //Nepali
        case "nl":    //Dutch
        case "nn":    //Norwegian Nynorsk
        case "nso":   //Northern Sotho
        case "oc":    //Occitan
        case "or":    //Odia
        case "pa":    //Punjabi
        case "ps":    //Pashto
        case "qu":    //Quechua
        case "rm":    //Romansh
        case "rn":    //Rundi
        case "rw":    //Kinyarwanda
        case "sd":    //Sindhi
        case "si":    //Sinhala
        case "sn":    //Shona
        case "so":    //Somali
        case "sq":    //Albanian
        case "ss":    //Swati
        case "st":    //Southern Sotho
        case "sv":    //Swedish
        case "sw":    //Swahili
        case "ta":    //Tamil
        case "te":    //Telugu
        case "tg":    //Tajik
        case "tk":    //Turkmen
        case "tn":    //Tswana
        case "to":    //Tongan
        case "ts":    //Tsonga
        case "ug":    //Uyghur
        case "ur":    //Urdu
        case "uz":    //Uzbek
        case "vo":    //Volapuk
        case "wo":    //Wolof
        case "xh":    //Xhosa
        case "yi":    //Yiddish
        case "zu":    //Zulu
            return $n === 1 ? 1 : 0;
        case "":      //Unknown language
        case "bo":    //Tibetan
        case "dz":    //Dzongkha
        case "fa":    //Persian
        case "gn":    //Guarani
        case "hu":    //Hungarian
        case "id":    //Indonesian
        case "ja":    //Japanese
        case "jv":    //Javanese
        case "ko":    //Korean
        case "ms":    //Malay
        case "my":    //Burmese
        case "om":    //Oromo
        case "su":    //Sudanese
        case "th":    //Thai
        case "tr":    //Turkish
        case "tt":    //Tatar
        case "vi":    //Vietnamese
        case "yo":    //Yoruba
        case "zh":    //Chinese
            return 0;
        case "br":    //Breton
        case "fr":    //French
        case "fil":   //Filipino
        case "hy":    //Armenian
        case "pt":    //Portuguese
        case "ti":    //Tigrinya
        case "wa":    //Walloon
            return $n > 1 ? 1 : 0;
        case "dv":    //Divehi
        case "ga":    //Irish
        case "gv":    //Manx
        case "iu":    //Inuktitut
        case "mi":    //Maori
        case "sa":    //Sanskrit
        case "se":    //Northern Sami
            switch($n){
            case 1:
                return 0;
            case 2:
                return 1;
            default:
                return 2;
            }
        case "be":    //Belarusian
        case "bs":    //Bosnian
        case "hr":    //Croatian
        case "ru":    //Russian
        case "sr":    //Serbian
        case "uk":    //Ukrainian
            if($n % 10 === 1 && $n % 100 !== 11){
                return 0;
            }
            else if($n % 10 >= 2 && $n % 10 <= 4 && ($n % 100 < 10 || $n % 100 >= 20)){
                return 1;
            }
            else{
                return 2;
            }
        case "cs":    //Czech
        case "sk":    //Slovak
            switch($n){
            case 1:
                return 0;
            case 2:
            case 3:
            case 4:
                return 1;
            default:
                return 2;
            }
        case "ar":    //Arabic
            if($n === 0){
                return 0;
            }
            else if($n === 1){
                return 1;
            }
            else if($n === 2){
                return 2;
            }
            else if($n % 100 >= 3 && $n % 100 <= 10){
                return 3;
            }
            else if($n % 100 >= 11){
                return 4;
            }
            else{
                return 5;
            }
        case "cy":    //Welsh
            switch($n){
            case 0:
                return 0;
            case 1:
                return 1;
            case 2:
            case 3:
            case 4:
            case 5:
                return 2;
            case 6:
                return 3;
            default:
                return 4;
            }
        case "gd":    //Gaelic
            if($n === 1 || $n === 11){
                return 0;
            }
            else if($n === 2 || $n === 12){
                return 1;
            }
            else if($n > 2 && $n < 20){
                return 2;
            }
            else{
                return 3;
            }
        case "is":    //Icelandic
            if($n % 10 === 1 && $n % 100 !== 11){
                return 0;
            }
            else{
                return 1;
            }
        case "lt":    //Lithuanian
            if($n % 10 === 1 && $n % 100 !== 11){
                return 0;
            }
            else if($n % 10 >= 2 && ($n % 100 < 10 || $n % 100 >= 20)){
                return 1;
            }
            else{
                return 2;
            }
        case "lv":    //Latvian
            if($n % 10 === 1 && $n % 100 !== 11){
                return 0;
            }
            else if($n !== 0){
                return 1;
            }
            else{
                return 2;
            }
        case "mk":    //Macedonian
            switch($n % 100){
            case 1:
                return 0;
            case 2:
                return 1;
            default:
                return 2;
            }
        case "mt":    //Maltese
            if($n === 1){
                return 0;
            }
            else if($n === 0 || ($n % 100 >= 1 && $n % 100 <= 10)){
                return 1;
            }
            else if($n % 100 >= 11 && $n % 100 <= 19){
                return 2;
            }
            else{
                return 3;
            }
        case "pl":    //Polish
            if($n === 1){
                return 0;
            }
            else if($n % 10 >= 2 && $n % 10 <= 4 && ($n % 100 < 10 || $n % 100 >= 20)){
                return 1;
            }
            else{
                return 2;
            }
        case "ro":    //Romanian
            if($n === 1){
                return 0;
            }
            else if($n === 0 || ($n % 100 > 0 && $n % 100 < 20)){
                return 1;
            }
            else{
                return 2;
            }
        case "sl":    //Slovenian
            switch($n % 100){
            case 1:
                return 0;
            case 2:
                return 1;
            case 3:
            case 4:
                return 2;
            default:
                return 3;
            }
        default:
            return null;
        }
    }
}

class QCoreApplication extends QObject{
    public static function installTranslator(QTranslator $translator): bool{
        if(in_array($translator, QObject::$_translators)){
            return false;
        }
        QObject::$_translators[] = $translator;
        return true;
    }

    public static function removeTranslator(QTranslator $translator): bool{
        $initialLength = sizeof(QObject::$_translators);
        QObject::$_translators = array_diff(QObject::$_translators, [$translator]);
        return sizeof(QObject::$_translators) < $initialLength;
    }
}
}