<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/include/setup.php');

class InvalidEmailException extends Exception{}
class InvalidNameException extends Exception{}
class InvalidPasswordException extends Exception{}
class InvalidEnumValueException extends Exception{}
class UserNotFoundException extends Exception{}
class UserAlreadyExistsException extends Exception{}
class WrongPasswordException extends Exception{}