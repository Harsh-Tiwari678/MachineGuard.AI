
//here 3d machine we are added taki machine bhi scankrke dekhskenge 
const heroCanvas = document.getElementById('hero-canvas');

if (heroCanvas) {
 
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        heroCanvas.clientWidth / heroCanvas.clientHeight,
        0.1,
        1000
    );
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });

    renderer.setSize(heroCanvas.clientWidth, heroCanvas.clientHeight);
    renderer.setClearColor(0x000000, 0);
    heroCanvas.appendChild(renderer.domElement);

 
    const geometry = new THREE.TorusGeometry(2, 0.5, 16, 100);
    const material = new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x2563eb,
        emissiveIntensity: 0.5
    });
    const gear = new THREE.Mesh(geometry, material);
    scene.add(gear);

    const smallGear1 = gear.clone();
    smallGear1.scale.set(0.5, 0.5, 0.5);
    smallGear1.position.set(3, 2, 0);
    scene.add(smallGear1);


    const smallGear2 = gear.clone();
    smallGear2.scale.set(0.4, 0.4, 0.4);
    smallGear2.position.set(-3, -2, 0);
    scene.add(smallGear2);

   
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x60a5fa, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x8b5cf6, 1);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    camera.position.z = 8;

    function animate() {
        requestAnimationFrame(animate);

        gear.rotation.z += 0.005;
        smallGear1.rotation.z -= 0.01;
        smallGear2.rotation.z += 0.015;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = heroCanvas.clientWidth / heroCanvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(heroCanvas.clientWidth, heroCanvas.clientHeight);
    });

   
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        gear.rotation.x = y * 0.3;
        gear.rotation.y = x * 0.3;
    });
}