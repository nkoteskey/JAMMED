class ElectricPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game) {
    super({
      game: game,
      renderer: game.renderer,
      fragShader: `precision mediump float;

uniform float     time;
uniform vec2      resolution;
uniform sampler2D uMainSampler;
varying vec2      outTexCoord;

void main(void) {
    vec2 uv = outTexCoord;

    // Electric pulse effect
    float pulse = sin(time * 5.0 + uv.y * 10.0) * 0.5 + 0.5;
    vec4 texColor = texture2D(uMainSampler, uv);

    // Add a blue glow, scaled by the alpha of the sprite
    vec3 glow = vec3(0.1, 0.3, 1.0) * pulse * texColor.a;

    // Combine the texture color and the glow
    gl_FragColor = vec4(texColor.rgb + glow, texColor.a);
}

            `,
    });
  }

  onPreRender() {
    this.set1f("time", this.game.loop.time / 1000); // Pass the current time to the shader
  }
}

class ElectricPipeline2 extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game) {
    super({
      game: game,
      renderer: game.renderer,
      fragShader: `precision mediump float;
  
  uniform float     time;
  uniform vec2      resolution;
  uniform sampler2D uMainSampler;
  varying vec2      outTexCoord;
  
  void main(void) {
      vec2 uv = outTexCoord;
  
      // Create finer and more chaotic patterns
      float frequency = 40.0;  // Higher frequency for thinner arcs
      float speed = 10.0;      // Faster time oscillation
      float intensity = 2.0;   // Amplify the glow intensity
  
      // Generate fine arcs and noise-like sparks
      float electricPattern = sin(time * speed + uv.y * frequency) * 
                              sin(time * speed * 1.5 + uv.x * frequency * 1.2);
  
      // Normalize to create pulsating motion
      float pulse = abs(electricPattern) * 0.7;
  
      vec4 texColor = texture2D(uMainSampler, uv);
  
      // Intense blue glow for electric arcs
      vec3 glow = vec3(0.2, 0.5, 1.0) * pulse * intensity * texColor.a;
  
      // Combine with the sprite's original color
      gl_FragColor = vec4(texColor.rgb + glow, texColor.a);
  }
  
              `,
    });
  }

  onPreRender() {
    this.set1f("time", this.game.loop.time / 1000); // Pass the current time to the shader
  }
}
