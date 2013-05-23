ftdb-shoutboxmod
================

=Améliorations de la Shoutbox de FrenchTorrentDB=

Version actuelle : 0.7.6 (01/12/2012)

==TELECHARGEMENTS==
  * *Chrome* : https://chrome.google.com/webstore/detail/fighljihcdhgeagfbhpkcdkpicnjakpl
  * *Firefox* : (Requiert [https://addons.mozilla.org/fr/firefox/addon/greasemonkey/ Greasemonkey]) https://thetabx.net/download/FTDB_Shoutbox_Mod.user.js
  * *Opera* : https://thetabx.net/download/FTDB_Shoutbox_Mod.user.js
  * *Internet Explorer* : (Requiert [http://www.ie7pro.com/ IE7Pro]) https://thetabx.net/download/FTDB_Shoutbox_Mod.ieuser.js
  * *Safari* : (Requiert [http://d.hatena.ne.jp/os0x/20100612/1276330696 NinjaKit]) https://thetabx.net/downloader

Changelog de la dernière version (0.7.6) :
  * Suppression du correcteur d'heure maintenant inutile
  * Correction du souci de surbrillance suite à la maintenance
  * Amélioration du tampon de la liste utilisateur, un peu moins de clignotements

  * Modification de l'organisation des données d'users et de smileys/macro
  * Modification complète du système de traitement sur serveur
  * Retour de la possibilité de nommer les smileys avec des caractères spéciaux
  * Correction du scrolling en cas d'url longue lorsque le redimensionnement est désactivé

  * Ajout d'une annonce suite à la mise à jour
  * Ajout de la possiblité d'ajouter des notes sur un utilisateur
  * Ajout de la possiblité d'afficher les statistiques d'un utilisateur (dernière connexion et activité)

* Les amis enregistrés dans la base avant la version 0.6.1 sont hors d'usage pour l'envoi de MPs, n'oubliez pas de les enlever puis rajouter dans la liste d'amis ! *


Testé sous
|| Chrome || Firefox + Greasemonkey || Internet Explorer + IE7Pro|| Opera || Safari + Ninjakit ||
|| 18.0.1025.168 || v12.0 + v0.9.18 || v9.0.8112 + v2.5.1 || v12.01 || 5.1.7 + (12/06/10) ||

Thèmes CSS officiels compatibles

----

= Sommaire :=
  * [#TELECHARGEMENTS Téléchargements]
  * [#PRESENTATION Présentation]
  * [#FONCTIONNALITES Fonctionnalités]
  * [#INSTALLATION Installation]
    * [#Chrome Chrome]
    * [#Firefox Firefox]
    * [#Internet_Explorer Internet Explorer]
    * [#Opera Opera]
    * [#Safari Safari]
  * [#FAQ FAQ]
  * [#PROBLEMES_CONNUS Problèmes connus]
  * [#PROCHAINES_MISES_A_JOUR Prochaines mises à jour]
  * [#CHANGELOG Changelog]
  * [#REMERCIEMENTS Remerciements]


==PRESENTATION==
FTDB Shoutbox Mod est un userscript (ou script Greasemonkey), qui permet d'ajouter quelques lignes de javascript sur un site précis. Il est totalement indépendant du serveur car tout le traitement est effectué par le navigateur car développé en Javascript/JQuery.
Ce script permet d'ajouter un certain nombre de fonctionnalités et d'ajustements à la shoutbox (voir Fonctionnalités).

Il est compatible Chrome, Firefox (avec l'extension Greasemonkey), Internet Explorer (avec l'extension IE7Pro), Opera, Safari (avec l'extension Ninjakit) et probablement d'autres navigateurs avec les plugins adaptés.

[https://thetabx.net/assets/images/ftdb_sbm_full.png https://thetabx.net/assets/images/ftdb_sbm_full_small.png]
Affichage principal avec toutes les options activées

https://thetabx.net/assets/images/ftdb_sbm_autoc.png
Auto-complétion du pseudo

https://thetabx.net/assets/images/ftdb_sbm_search.png
Recherche dans les utilisteurs connectés

https://thetabx.net/assets/images/ftdb_sbm_autolink.png
Remplacement d'un lien vers un torrent par son titre

https://thetabx.net/assets/images/ftdb_sbm_highlight.png
Surbrillance des messages par mouseover sur un pseudo d'utilisateur


==FONCTIONNALITES==
Chacune des fonctions suivantes est activable ou non par le biais d'un écran d'options trouvable ici :
https://thetabx.net/assets/images/ftdb_sbm_options3.png


===Shoutbox :===
*- Inversion du sens d'affichage des messages* : 
Les messages les plus récents en bas, logique humaine de lire du haut vers le bas, dans l'ordre chronologique.

*- Suppression des smileys, images et embed flash* : 
Pour ceux qui ne veulent que du texte :) (un smiley est remplacé par son équivalent texte, les images et embed sont transformés en simple lien)

*- Scroll statique intelligent* : 
L'inverseur de shoutbox scroll automatiquement au dernier message. Cette fonction permet de l'en empêcher si vous regardez un message plus ancien.

*- Remplace les liens vers un torrent/topic par leur titre* : 
Permet d'obtenir le titre du torrent (ou du topic sur le forum) directement sur la box, à la place du simple lien.

*- Evite les changements entre http et https pour les liens du tracker* : 
Si vous êtes en https et un autre user link une page du site en http, le lien est automatiquement adapté en https (Et inversement si vous êtes en http pour éviter le problème du certificat).

*- Nombre maximum de messages affichés* : 
Le serveur envoie les 30 derniers messages de la shoutbox, chaque nouveau message posté est ajouté à votre affichage jusqu'au seuil défini. Arrivé au seuil, les messages les plus anciens sont supprimés.

*- Temps de mise en valeur des nouveaux messages* : 
Chaque nouveau message arrivé est affiché avec un fondu de durée personnalisable.

*- Auto-complétion des pseudos* : 
Tapez les 3 premières lettres d'un pseudo puis tab (ou la flèche droite)  pour le valider automatiquement et continuez votre message (S'il existe plusieurs utilisateurs commençant par les mêmes 3 premières lettres, vous devez taper quelques lettres supplémentaires jusqu'à ce qu'un seul utilisateur corresponde).

*- Surbrillance des messages par utilisateur* : 
Passez la souris sur un pseudo d'utilisateur et ses messages postés dans la shoutbox sont mis en valeur

*- Nombre de messages non-lus dans le titre lorsque l'onglet n'est pas sélectionné* : 
Indique les messages reçus dans le titre pendant que le l'onglet n'était pas sélectionné et met en valeur les messages non-lus lors du retour dans l'onglet


===Liste des utilisateurs connectés :===
*- Champ de recherche des utilisateurs connectés à la shoutbox* : 
Un double clic sur le nombre d'utilisateurs connectés permet de rechercher précisément un pseudo.

*- Annonce des connexions/déconnexions des utilisateurs* : 
Fondu sur leur pseudo en tête de liste.

*- Nombre d'annonces à chaque update* : 
Evite de remplir la liste des utilisateurs par des annonces au delà d'un certain nombre.


===Dimensions :===
*- Redimensionnement automatique de la box* : 
Largeur automatique pour remplir au mieux le navigateur, hauteur personnalisable.

*- Hauteur réglable au cliquer/déplacer* : 
Déplacez les bords de la zone de texte d'envoi des messages, la shoutbox s'adaptera automatiquement. Il est conseillé de désactiver l'option une fois les réglages terminés.


===Autres :===
*- Ajout d'un client IRC Web* : 
Une fenêtre contenant chat IRC (par http://mibbit.com ) est ajoutée sous la chat box, gardez une vue sur les 2 en même temps !

*- Vérificateur de nouveaux Messages Privés* : 
Le script met à jour le compteur de MP toutes les 15 secondes, si un nouveau MP arrive, une annonce est affichée dans la shoutbox (uniquement pour vous) avec le nom et le sujet du MP + un lien vers le message précis. L'icone des MP clignote aussi lorsque vous avez des MP non lus.

*- Cacher la barre d'infos grades* : 
Plusss de place, toujours plusss de place !

*- Autoriser l'envoi de statistiques anonymes* : 
Permet de me faire partager votre utilisation du script afin de l'améliorer (version du script et options activées). Active également le vérificateur de version dans les options, si une nouvelle version est disponible, un lien vers ce topic est affiché.


==INSTALLATION==

===Chrome===
Cliquez sur le lien de téléchargement donné plus haut, puis
https://thetabx.net/assets/images/ftdb_sbm_chrome1.png
suivi de
https://thetabx.net/assets/images/ftdb_sbm_chrome2.png

Pour finir un petit refresh sur la page de la shoutbox.

===Firefox===
Installez [https://addons.mozilla.org/fr/firefox/addon/greasemonkey/ Greasemonkey], puis cliquez sur le lien de téléchargement donné plus haut, suivi de
https://thetabx.net/assets/images/ftdb_sbm_ff.png

Et finir avec un petit refresh sur la page de la shoutbox.

===Internet Explorer===
Installez tout d'abord [http://www.ie7pro.com/ IE7Pro] en prenant garde à ne pas installer leur pub.
https://thetabx.net/assets/images/ftdb_sbm_ie1.png

Puis téléchargez la version spécifique à IE du script avec un clic-droit > enregistrer-sous.
Déplacez le script téléchargé dans le dossier userscripts de IE7Pro ( C:/Program Files/IEPro/userscripts par défaut).
Lancer Internet Explorer et entrer dans les options userscripts de IE7Pro pour activer le script
https://thetabx.net/assets/images/ftdb_sbm_ie2.png

Finir par un refresh de la page, éventuellement un redémarrage d'IE si cela ne suffit pas

===Safari===
Télécharger [http://d.hatena.ne.jp/os0x/20100612/1276330696 NinjaKit] et l'installer. Ensuite, aller sur la [https://thetabx.net/downloader page de téléchargement adaptée à Ninjakit] et installer le script.
Rafraîchir ensuite la page de la shoutbox.

===Opera===
Téléchargez le script avec le lien en haut de page puis stockez le dans un dossier permanent. (Le script ne pourra pas être supprimé par la suite). Dans Opera, indiquer le chemin vers le dossier du script dans :
https://thetabx.net/assets/images/ftdb_sbm_opera.png

===Autres===
Beeh changez de navigateur ou trouvez un plugin imitant le fonctionnement de Greasemonkey pour votre navigateur.


==FAQ==

*- CA NE MARCHE PAS !*
  * Faites un refresh sur la page de la Shoutbox
  * Assurez vous d'utiliser la dernière version du script, de votre navigateur et éventuellement de Greasemonkey
Si le script ne fonctionne toujours pas, postez une issue ici, [https://code.google.com/p/ftdb-shoutboxmod/issues/entry postez un problème] avec un screenshot de l'erreur observée/une description précise/le log console de javascript

*- Le redimensionnement automatique déconne*
Si vous utilisez un thème CSS personnalisé, il est possible que cela interfère avec le redimensionnement. [https://code.google.com/p/ftdb-shoutboxmod/issues/entry Postez un problème] avec le nom du CSS employé/un screenshot de l'erreur observée

*- Lors de l'installation, mon navigateur a dit que le script pouvait accéder à mes données !!*
En effet, le script peut accéder <b>UNIQUEMENT</b> aux données déjà affichées sur la page. De plus, lors de l'installation, vous avez peut-être vu qu'il ne s'active <b>QUE</b> sur la page de la shoutbox. Enfin, si vous êtes curieux ou suspicieux, un lien vers le code source est disponible en haut de la page.

*- Quelles sont ces statistiques anonymes envoyées ?*
Le script se permet, si l'option adéquate est activée, d'envoyer le nom du script ainsi que sa version à mon serveur afin d'établir quelques statistiques sur son utilisation.
Voici un var_dump() des données que mon serveur reçoit :
{{{ 
array(3) {
    ["namespace"]=>
    string(4) "ftdb"
    ["application"]=>
    string(8) "shoutbox"
    ["version"]=>
    string(5) "0.3.20"
    ["options"]=>
    string(5) "0:1:0:0:0:1:1:1:0:1:0:0:1:0:1:1"
} 
}}}

*- Comment éviter le fondu sur les nouveaux messages*
Mettre "Durée du fade in des nouveaux messages" à 0.

*- Comment rechercher un utilisateur non connecté*
Actuellement impossible, l'outil de recherche ne se base que sur les utilisateurs connectés à la shoutbox.


==PROBLEMES CONNUS==

*- Il arrive que la shoutbox arrête de se mettre à jour alors que la liste des utilisateurs reste actualisée*
Cette partie est gérée par le javascript de la page et non par ce script, je ne peux donc pas modifier ce comportement, même s'il semble que le script augmente la fréquence de ce problème. Il suffit de rafraîchir la page pour relancer l'actualisation.


==PROCHAINES MISES A JOUR==

- Rien pour le moment. [https://code.google.com/p/ftdb-shoutboxmod/issues/entry Proposez vos idées] !


==CHANGELOG==
*- 0.7.6 :* (01/12/2012)
  * Suppression du correcteur d'heure maintenant inutile
  * Correction du souci de surbrillance suite à la maintenance
  * Amélioration du tampon de la liste utilisateur, un peu moins de clignotements

  * Modification de l'organisation des données d'users et de smileys/macro
  * Modification complète du système de traitement sur serveur
  * Retour de la possibilité de nommer les smileys avec des caractères spéciaux
  * Correction du scrolling en cas d'url longue lorsque le redimensionnement est désactivé

  * Ajout d'une annonce suite à la mise à jour
  * Ajout de la possiblité d'ajouter des notes sur un utilisateur
  * Ajout de la possiblité d'afficher les statistiques d'un utilisateur (dernière connexion et activité)
*- 0.7.3 :* (22/10/2012)
  * Ajout d'un filtre antiflood sommaire
  * Modification de la gestion des données sauvegardées : devrait corriger le problème de backup
  * Modification du suppresseur de couleur pour enlever tous les effets de style (b/i/u/s)
  * Ajout d'un détecteur de noms de torrent. Transforme le nom en lien vers la page de recherche
  * Modification du filtrage d'utilisateur : devrait améliorer les performances et éviter les lags au filtrage
  * Ajout d'un correcteur d'heure : enlève 3 minutes et 57 secondes sur les timestamp si activé

*- 0.7.2 :* (28/09/2012)
  * Ajout d'un filtrage temporaire pour ne voir que les message d'une seule personne à la fois si besoin
  * Modification de l'auto-complétion pour commencer par les utilisateurs ayant parlé récemment
  * Modification de l'ensemble du système de backup pour éviter les problèmes de caractères spéciaux
  * Modification du rythme des backups pour n'envoyer les données que lorsqu'elles ont été modifiées
  * Réécriture complète du moteur de la liste utilisateur
  * Ajout d'une mémoire tampon sur la liste utilisateur
  * Correction d'une fuite mémoire sur la liste utilisateur
  * Amélioration du système d'amis / ignorés
  * Correction du translateur Lien vers fiche torrent -> Nom du torrent
  * Correction du détecteur du highlight au quote pour les pseudos avec plusieurs "."
  * Correction de l'anti-coloration pour n'enlever que la couleur
  * Correction de l'updater de couleurs des amis en cas de changement de classe
  * Correction de la position des images si elle a été rendue cliquable
  * Correction d'un bug du moteur Javascript de Firefox
*- 0.6.5 :* (08/09/2012)
  * Modification de l'envoi des statistiques
  * Retour aux liens vers le forum, plutôt que Google code
*- 0.6.4 :* (03/09/2012)
  * Correction de la notification au quote
  * Correction de la largeur des stats utilisateur
  * Correction du clignotement du nombre de MP non lus
  * Correction des images cliquables pour éviter d'écraser les liens déjà présents
  * Amélioration de l'envoi des statistiques
*- 0.6.3 :* (30/08/2012)
  * Ajout du nom des smileys perso en tooltip : issue 5
  * Ajout d'une option rendant les images cliquables : issue 6
  * Réorganisation des options en onglets : issue 8
  * Ajout des macros textuelles : issue 7
  * Correction d'un problème de backup des options en cas de différences de versions
*- 0.6.2 :* (12/08/2012)
  * Correction de l'outil d'envoi des MP suite aux modifications de !HexMaster
*- 0.6.1 :* (09/08/2012)
  * Correction de l'annonceur d'updates afin d'éviter les annonces en cas de réponse incorrecte
  * Amélioration du système de backup pour supporter différents Navigateurs/OS sur un seul compte
  * Ajout d'une option pour afficher le ping dans le titre de la shoutbox
  * Ajout d'une option pour un système d'auto-complétion comme IRC (1+ lettre(s) puis tab jusqu'à obtenir le pseudo désiré) : issue 2
  * Ajout d'une option pour insérer ": " suite à l'auto-complétion en début de phrase : issue 1
  * Les liens vers le forum ont été remplacés par les liens vers la page GoogleCode du projet
*- 0.6.0 :* (03/08/2012)
  * Correction du bouton des options, situé maintenant en bas de page
  * Correction de la désactivation du traitement de la liste utilisateur
  * Correction du scrolling au refresh (Firefox principalement)
  * Ajout d'une option pour empêcher la coloration de la shoutbox
  * Ajout d'une option de configuration de la largeur de la shoutbox
  * Ajout d'une option de sauvegarde/restauration automatique des options/amis/smileys
*- 0.5.4 :* (12/07/2012)
  * Bugfix de la barre des usersmiley avec Firefox
  * Amélioration du comportement des smileys (Besoin de retours sur le reset des smileys à chaque maj ou non)
*- 0.5.3 :* (09/07/2012)
  * Adaptation aux changements effectués sur la shoutbox native
  * Suppression de la gestion du BBCode/Smiley
  * Amélioration des Usersmiley
*- 0.5.1 :* (06/07/2012)
  * Arrivée de l'extension Chrome !
  * Correction du scroll en cas d'image
  * Correction du son de notification
  * Correction de la notification du au quote par un user ignoré
  * CSS entièrement recodé
  * Correction en cas de CSS Harmony
*- 0.4.19 :* (05/06/2012)
  * Correction des fonctions de debug sous Firefox
  * Annonce en cas d'impossibilité de sauvegarde (plutôt qu'un fail silencieux)
  * Ajout de la liste d'amis/ignorés indépendante de la liste utilisteurs (A/I à droite du nombre de connectés) à la demande de boby165
  * Ajout du menu contextuel sur les utilisateurs entrants/sortants
  * Ajout des commandes de smileys personnalisés: Le nom du smiley personnalisé sera remplacé par l'image lors de l'envoi du message (style MSN)
  * Ajout d'une commande d'envoi de mp direct (Nécessite les mp dans la shoutbox + la recherche dans les utilisateurs): "/mp zergrael" ouvrira une fenêtre de mp direct vers l'utilisateur ZergRael
*- 0.4.18 :* (02/06/2012)
  * Changement de la gestion des smileys personnalisés
  * Passage des smileys personnalisés sur une barre sous la barre de BBCodes (passage de la limite à 30 smileys)
  * Choix de la notification sonore pour les quotes/mp
  * Corrections des hacks pour le thème Harmony de Mdzelle
*- 0.4.17 :* (01/06/2012)
  * Retour des smileys personnalisés
  * Distinction entre les versions IE/Non IE
  * Corrections spécifiques pour le thème Harmony de Mdzelle
*- 0.4.16 :* (31/05/2012)
  * Son à la réception de MP (Ouais ca fait mal aux oreilles )
  * Annonce dans la shout s'il y a une nouvelle version dispo
  * Vérifications lors de l'envoi de MP dans la shout
  * Support de Safari sous OSX Lion
*- 0.4.15 :* (27/05/2012)
  * Désactivation de la vérification du timestamp sur la liste utilisateur, faisait clignoter la liste d'amis en cas de lag
  * Vérification de l'ordre ainsi que du retard des timestamp sur la shoutbox => Amélioration de la gestion des doubles messages en cas de lag
  * Bugfix de la vérification des MP en cas de lag
  * Bugfix de la shoutbox vide avec les options au minimum
*- 0.4.14 :* (26/05/2012)
  * Bugfix des double messages (en théorie) dus principalement aux lags sur les requêtes au serveur
  * Correction du scroll au refresh
  * L'inversion de la shoutbox n'est plus obligatoire pour la plupart des options
*- 0.4.9 :* (21/05/2012)
  * Correction du crash lors de la désactivation de l'inversion
  * Correction de quelques typo dans les options
  * Amélioration des performances lorsque l'inversion est désactivée
*- 0.4.8 :* (19/05/2012)
  * Correction de quelques caractères non reconnus dans l'envoi de MPs
  * Correction de la fermeture de l'onglet des MP s'il y a un lag à l'affichage
  * Correction du son au quote (Passage à un flash invisible), le résultat peut varier selon les navigateurs 
*- 0.4.7 :* (19/05/2012)
  * Correction de l'affichage de la barre de BBCode lorsque le redimensionnement est désactivé
  * Surbrillance sur les messages postés avant l'arrivée sur la shoutbox
  * Notification sonore lorsque quelqu'un vous cite
  * Amélioration du menu contextuel
  * Ajout de la liste d'amis (resteront dans la liste utilisateur même déconnectés) et d'ignorés (les messages seront cachés)
  * Sélection de la police de l'ensemble de la shoutbox
  * Ajout d'un système d'envoi et de réception des MP dans l'onglet de la shoutbox
*- 0.4.6 :* (17/05/2012)
  * Ajout d'une barre de boutons BBCode et smileys
  * Ajout d'une surbrillance lorsque vous êtes cité
  * Ajout d'un menu contextuel sur les utilisateurs permettant d'envoyer un MP/de les ignorer
*- 0.4.5 :* (15/05/2012)
  * Bugfix de l'annonce des nouveaux MPs (ne fonctionnait pas lors du passage de 0 à 1 MP)
  * Amélioration des performances de l'analyseur de liens
*- 0.4.3 :* (15/05/2012)
  * Bugfix de la surbrillance des messages pour les pseudos à majuscules/caractères spéciaux
  * La fenêtre d'options est plus agréable, plus simple et indique clairement quelles options sont nécessaires pour faire fonctionner d'autres
  * Bugfix de la détection des titre de topic/torrents (c'est le dernier promis)²
  * Ajout du redimensionnement au clic sur les bords de la zone d'envoi de messages
  * Ajout du nom et du titre du nouveau MP recu avec le lien pointant directement sur le MP
  * Amélioration de l'animation des (dé)connexions
  * Passage à 400 messages maximum (à vos risques et périls :o)
  * Passage du temps entre les vérifications des MP à 15 secondes au lieu de 40 grâce à l'optimisation de la requête
  * Bugfix de l'autocomplétion
*- 0.3.20 :* (14/05/2012)
  * Refonte interne des options. Vous perdrez votre configuration en mettant à jour !
  * Bugfix de la détection des titre de topic/torrents (c'est le dernier promis)
  * Ajout d'une option pour auto-compléter avec la flèche droite au lieu de tab
  * Ajout d'une option pour laisser ou non un espace après l'auto-complétion
  * Met en surbrillance les message d'un utilisateur en passant la souris sur son pseudo
  * Affiche le nombre de messages reçus pendant que l'onglet n'était pas sélectionné
  * Ajout des options utilisées dans l'envoi des stats anonymes
*- 0.3.17 :* (12/05/2012)
  * Amélioration de la détection du titre des topic/torrents
  * Ajout d'une option pour forcer l'ouverture des liens dans un nouvel onglet
  * Ajout d'une option de redimensionnement en hauteur de la fenêtre web IRC
*- 0.3.16 :* (12/05/2012)
  * Correction de quelques problèmes dans les options lors des mises à jour
  * Ajout d'une vérification de la version dans les options si l'envoi des stats est activé
  * Ajout d'un vérificateur de nouveaux MP toutes les 40 secondes avec clignotement de l'icone + annonce dans la shoutbox
*- 0.3.15 :* (12/05/2012)
  * Support d'IE9 avec IE7Pro
  * Nouvelle méthode de détection d'arrivée des messages, d'où
  * Bugfix de l'ensemble de la shoutbox, il ne devrait plus y avoir de messages en double ou d’arrêt du rafraîchissement (en théorie )
  * Valeur max de "Nombre max de messages affichés" réduite à 150 à la place de 400 (merci @alandar83)
  * Ajout d'un léger slide sur les (dé)connexions
*- 0.3.11 :* (11/05/2012)
  * Bugfix de l'auto-complétion, quelque soit votre vitesse d'écriture
  * Le pseudo est auto-complété avec la bonne casse
  * Ajout d'un délai de 10ms avant l'affichage du pseudo correspondant
  * Sécurisation du tab de l'autocomplétion. Si la séléction est invalide le message ne sera pas altéré
  * Bugfix de la limite d'affichage de (dé)connexions
*- 0.3.7 :* (11/05/2012)
  * Bugfix sur le remplacement des images/liens/noms
  * Typo dans les options
  * Réactivation de l'affichage du nom des topic/torrents à la place des liens
  * Le web IRC comprend correctement les accents (passage en latin-1)
  * Affiche l'équivalent texte des smileys à la place de la suppression simple
  * Ajout d'un lien vers ce topic dans les options sur le numero de version
*- 0.3.4 :* (10/05/2012)
  * Désactivation temporaire de l'affichage du nom des topic/torrents à la place des liens - Cause l'arrêt des mises à jour de la shoutbox !
*- 0.3.3 :* (09/05/2012)
  * Première release publique.

==REMERCIEMENTS==
  * *!HexMaster* pour ses tips sur l'utilisation des API du tracker et son aide pour le développement.
  * *alandar83* pour avoir beta-testé quasiment toutes les versions et pour son aide à résoudre des problèmes en tout genre.
  * Tous les utilisateurs du script, et surtout ceux qui prennent le temps de me remonter des soucis/suggestions.
  * L'ensemble de la communauté du tracker !



*Notez tout de même que le script est toujours en beta et qu'il est possible que bugs arrivent ou que des fonctionnalités manquent.*

Si vous avez des suggestions d'améliorations ou que vous trouvez un bug, n'hésitez pas à [https://code.google.com/p/ftdb-shoutboxmod/issues/entry poster] un maximum de détails et éventuellement un screenshot afin de m'aider à améliorer ce script!
