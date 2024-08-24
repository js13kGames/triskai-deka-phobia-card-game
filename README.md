# js13k-2024
Game for js13k 2024 Triskaidekaphobia

https://js13kgames.com/

https://medium.com/js13kgames/js13kgames-2024-start-and-theme-announcement-5d734f77da68

# To do / ideas #

* Background as SVG image
* Change icons (swords, shield, shamrock, death, app icon to SVG)
* Game context (screen) adjustments for mobile with correct aspect ratio
* If possible set the default context to 100% height and centered
* Add webmanifest

* Enemy portrait - Slimes
* Enemy animation (scale Y)
* Enemy face expressions (surpries when got hit, angdy when low health, dead)

* Player portrait - Isoldee
* Player face expressions

* Introduction window with game rules and objective (force confirmation to enable sound effects)
* Exp, Level up, progression through stages and different enemies
* Progress save in local storage

* Enemy and Player texts messages
* Enemy Boss Shakhaar
* Enemy Boss Lilith

# Known issues #

* FIXED // Sometimes (pretty often) after some action (dunno when but probably combination of turn change and action bar action) it is a CPU turn but he doesn't do anything. Probably something with timeouts and action flags.
* FIXED // Sometimes defense card have incorrect pattern color (probably Shamrock card)

* Incorrect background - change to SVG image instead of gradient
* Incorrect size on mobile - adjust width and height - currently only height is checked
* No icons (death, shield) on mobile and mac - change to SVG shapes included in game
* Action timer is not working in Safar web browser on Mac OS - find how to handle / change to regular JS animation or just get rid of the timer

# Credits #

Sounds made with https://killedbyapixel.github.io/ZzFX/
