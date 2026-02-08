# Prompts Used to Create This Game

This file contains all the prompts in their original glory (spelling mistakes and all) used to create this code. I am including them here to show the flow and the iterations I went through.

I used almost exclusively Claude Code with Opus 4.5 on Claude Pro subscription. Near the end when Opus struggled with gem rendering, I resorted to copy pasting gem meshes and renderer code into ChatGPT with GPT 5.2 model to help me fix the gem appearance.

No manual code editing was performed on any of this source and everything was done purely through prompting.

```
create a new web based game with advanced graphics. It should involve princess selection out of multiple disney-style princesses to choose your character. After you should be able to start the game. It should be puzzle-style game with an introduction saying about evil dragon stealing royal treasury and while flying away accidentally dropping it all over the place. Princess should then be collecting the various jewels and other jewellery (bracelets, earrings, make them very shiny). Collecting involves pairing them up to have them disappear into princess' purse. Think of it as bewkewelled-style gameplay. Introduce dragon stealing back treasure element as in game events when you fail to get large enough chains. Game should ensure that it is playable and be very similar to bejewelled. Clicking on purse should show summary of how many things have been collected while pausing the game and showing system menu. Provide cookie-based save and load functionality to allow resuming. Graphics should be high quality 3d rendered using best available 3d game JS libraries. Code the game in typescript and ensure it includes a lot of unit tests  
```

```
nothing shows on screen when I run it. Just purple background
```

```
gem selection should allow dragging them. Click selection should be more pronounced. Gems themselves should be prettier and more attractive to a child playing this. Princess selection does not have any princess portrait
```
-------------------------------
### Rate Limit Reached
-------------------------------
```
continue and improve appearance. Remember that the score shouyld show up on a purse and clicking on it brings menu. Decorate main game screen too and ensure that every turn there IS a way to progress forward and the game never ends up in a state where no moves are possible. Performance of the main game when moving gems is also very slow and gems still look very ugly 
```

```
clicking to move gems and clicking on gems to swap them no longer works. Dragon is very ugly and does not look like a dragon at all
```

```
click detection is still broken in the main game. AFter clicking to speed through story no more clicking is possible and dragon model gets stuck in the middle of the screen. Also, gems are very very ugly. They need to look more like treasure and those coloured backgrounds are not very appealing either      
```

```
click in main game is still not working. Just a soimple left click on gem or on purse or on help - none of these do anything 
```

```
excellent. Dragon needs to actually steal gems, so show how many he snatched (not too many!), In purse we need to show how many he stole too          
```
-------------------------------
### Rate Limit Reached
-------------------------------
```
continue iterating. Gems are so ugly still. I added screenshot in repo root so you can see. It is a png. Gems should be shiny and look precious, not half baked as they are now  
```

```
gems are still ugly. white oval ones are too huge. and colours are horrid. new screenshot added for reference 
```

```
quantity stolen by dragon shows as I on the popup. stolen qty popup appears before the dragon itself. You can still get into a situation where game is not solvable. When enetring purse and then resuming, dragon bar resets to zero. Add a button to shuffle the board at a cost of a percentage of gems in the purse. Give this mechanism name and explanation suitable to the setting and story   
```

```
remember to commit   
```

```
dragon message is not centred. There are no tooltips for any buttons, especially fairy dust one. Save and resume does not persist board state and purse contents. Dragon bar is weird and there is not explanation for what makes dragon come in and what makes it delay  
```

```
when we have combo, it happens too fast and we cannot see what occurred. just text sayong 2x combo but we can't see what caused it. Also animation for gems collecting should flow into the purse and purse puls with gems of correct colour(s) on it lighting up. score should show total gems, not some arbitrary number. hint button does nothing. Solve one issue at a time and commit  
```

```
cascade should reduce threat. purse now shows zeros for all gem counts and qty stolen  
```

```
gem count on game board does not account for the ones stolen, unlike in purse UI   
```

```
stolen gems count should only decrement and be applied after dragon animation finishes, not immediately. value going down is not seen          
```

```
dragon incoming message is not centred properly       
```

```
add readme and mit license. also suitable gitignore   
```

```
continue and also ensure game scales properly - bottom of the purse menu and some other larger screens disappears below screen bounds. We also need powerups and other options to make the game more engaging and addictive for children. Review psychology of video games and add features that increase addictiveness and dopamine rewards 
```

```
save button is gone. star and rainbow gems aren't visible anywhere. 
```

```
streaks shouldn' count regular x3 since those happen all the time. only combo x4 and cascades. also, when cascade occurs from x3 dragon counter still grows if dragon is due to appear since starting x3 is counted as a dragon anger   
```

```
stolen count is not incrementing in the purse anymore. No explanation or tooltip for special poweriups and what they do   
```

```
move dragon anger bar to the side since it is covering a part of the board. perhaps do the same with save load buttons in the purse? or reposition them in other way. Make a powerup that, when matched as a line will collect all gems from the board of the same colour. e.g. red special gem gets matched and ALL reds are gone from the board into the purse  
```

```
commit
```

```
improve dopamine and give some powerups for the streaks. Also make princess choice matter. Board corner decorations are on top of everything else instead of bottom of z order  
```

-------------------------------
### Rate Limit Reached
-------------------------------

```
continue
```

```
how can powerups be stronger? they are either there or not there at all. There is no level to them. Review all the powerups and also improve princess faces to make them prettier and more attractive to children. Dragon stealing amount should be always between 2 and 9 gems, not proportional to quantity you have. Another thing to check - how can rewards be scaled for princesses? they are always the quantity of gems. You need to think deep about princess powers. Also introduce cost to the hint button. Make it fixed cost of a certain amount of gems that increases on each use until it hits the limit of 10       
```

```
commit, add tests for all new abilities and then commit again. ensure that powerups, princess abilities and all the mechanics are fully tested. finally add github actions workflow to build and deploy to github pages. also streak status display covers princess ability information. move it a little down so they do not overlap     
```

```
powerup gems shouldn't have a ring around them, just the star or rainbow decoration. The halo thing is distracting   
```

```
update readme to match latest changes. numbers and information is all out of sync  
```

-------------------------------
### Rate Limit Reached
-------------------------------

```
COntinue and also change animation for star gems and the rainbow ones to be a sparkling band of stars or a rainbow band respectively. Current visualisation is hard to see and clips badly through some gems. Make sure no clipping occurs with new decoration and get rid of the original star or rainbow orbiting the gem - it is too hard to see. Also see if gems themselves can be more sparkly and pretty by adding some additional lighting sources, perhaps? They look nice right now but need more vibrancy and richness to them, so they look like real treasures.   
```

```
diamonds look too white and emeralds don't have gem transparency. They look too solid. Check out the screenshot I just added. Gems should look less like solid blocks. Do not commit screenshot itself!    
```

This was the point when I realised that Opus 4.5 is not getting anywhere with gems and is only making them worse while rapidly approaching rate limit. So I took screenshots and renderer code and pasted into ChatGPT with GPT 5.2 model asking to produce prompt for Claude Code, which I dilligently started pasting back into Claude Code.

```
Still dull. if anything, they look even worse somehow. GPT 5.2 recommends the following: "Use MeshPhysicalMaterial with transmission: 1.0, non-zero thickness scaled to the gem size, color via attenuationColor/attenuationDistance (not opacity), set roughness: 0, ensure the geometry is faceted (toNonIndexed()), and light it with an HDR PMREM scene.environment with boosted envMapIntensity."     
```

At this point game stopped working completely and I took the error directly from browser console and provided to Claude Code to fix (which it did).

```
Uncaught TypeError: Cannot read properties of undefined (reading 'compile')   
    at PMREMGenerator._compileMaterial (three.js?v=d2d75a42:9982:20)          
    at new PMREMGenerator (three.js?v=d2d75a42:9854:10)                       
    at Renderer3D.createEnvironmentMap (Renderer3D.ts:88:28)                  
    at new Renderer3D (Renderer3D.ts:21:10)                                   
    at new Game (Game.ts:34:21)                                               
    at main.ts:7:14    
```

```
GPT 5.2 says:     
•    For each colored gem material (Ruby/Sapphire/Emerald/Amethyst), set material.color to the gem’s hue (not 0xffffff) and increase attenuationDistance from ~0.25–0.3 to ~2.0–4.0 (keep attenuationColor the same hue), and reduce thickness to about GEM_SIZE * 0.35.                                                                         
•    For Diamond, remove absorption by setting attenuationColor to pure white and attenuationDistance to a very large value (e.g. 1000), and lower envMapIntensity to ~2.0.                                                      
•    Remove the fake “highlight” sphere meshes (they read as cartoon gloss once transmission is on), or at minimum disable them for transmitted gems.                                                                         
•    Ensure you have an HDRI/PMREM environment assigned to scene.environment (not just lights) so refraction/reflection has something high-contrast to sample.     
```

```
GPT 5.2 says:
1.	In Renderer3D.createEnvironmentMap(), change the sky gradient to mostly dark (#0b0616 at 0, #120a2a at 0.2, #06030e at 0.6, #020106 at 1), delete the existing loop that draws 50 white dots, and replace it with this hotspot loop:

ctx.globalCompositeOperation = 'lighter';
for (let i = 0; i < 10; i++) {
const x = Math.random() * 512;
const y = Math.random() * 200;
const coreR = Math.random() * 2 + 1;
const haloR = coreR * (12 + Math.random() * 10);

const g = ctx.createRadialGradient(x, y, 0, x, y, haloR);
g.addColorStop(0, 'rgba(255,255,255,0.9)');
g.addColorStop(0.05, 'rgba(255,255,255,0.35)');
g.addColorStop(1, 'rgba(255,255,255,0)');
ctx.fillStyle = g;
ctx.beginPath();
ctx.arc(x, y, haloR, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = 'rgba(255,255,255,1)';
ctx.beginPath();
ctx.arc(x, y, coreR, 0, Math.PI * 2);
ctx.fill();
}
ctx.globalCompositeOperation = 'source-over';

2.	In Renderer3D.createEnvironmentMap(), change pmremGenerator.fromScene(envScene, 0.04) to pmremGenerator.fromScene(envScene, 0.1).
3.	In Renderer3D constructor, change hemisphere/ambient to new THREE.HemisphereLight(0xffffff, 0x443366, 0.2) and new THREE.AmbientLight(0xffffff, 0.15), and in setupPointLights() halve every intensity in lightConfig.
4.	In GemMeshFactory materials for transmitted gems, set envMapIntensity to 1.7 for Diamond and 2.0 for Ruby/Sapphire/Emerald/Amethyst (leave Gold/Pearl unchanged).

```

-------------------------------
### Rate Limit Reached
-------------------------------

```
continue
```

```
commit
```

```
GPT 5.2 says: Update the Three.js lighting/materials to increase gem contrast and reduce the “uniformly lit/plastic” look: in Renderer3D, set ambientLight.intensity = 0.10 and hemisphereLight.intensity = 0.15, and lower the front fill point light in lightConfig at [0,0,10] to intensity: 0.18; in GemMeshFactory, set roughness: 0.02 for colored transmitted gems (Ruby/Sapphire/Emerald/Amethyst) while keeping Diamond at roughness: 0.0, set colored gems envMapIntensity to 1.8 and Diamond envMapIntensity to 2.2; optionally (if performance allows) add an “inner shell” to all transmitted gems by cloning the gem material with side: THREE.BackSide, multiplying its envMapIntensity by 1.5, creating a second mesh from the same geometry scaled to 0.97, and adding it to the gem’s group.
```

```
commit
```

It is time to work on improving the visuals of the game. To better do this, I am leveraging SOTA agentic skills. I installed vercel agent-browser and frontend-design skills to improve the visuals of the game.
Opus 4.6 came out, so I am switching to that with extra usage (promotional $50), allowing me to iterate for longer

```
/frontend-design
```

```
main game screen. I want it to look more engaging and appealing. Currently  it is very bare and minimalistic 
```

```
Use agent-browser to test the game and apply best practice UI fixes, especially around scaling and making UI work on mobile devices. Also use frontend-design skill to recommend best practices
```
(5 our limit was reached and I am now on extra usage, burning promotional credits)

```
prefer agent-browser over playwright for browser usage. Continue verifying mobile compatibility. Princess selection screen is still not mobile friendly. Main board does not scale properly and corner controls don't work with main board either. gitignore test-*.png files and commit prior to iterating and when you accomplish something 
```