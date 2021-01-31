phongFS = `
    precision highp float;
    
    struct PointLight {
        vec3 position;
        vec3 color;
        float intensity;
    };

    struct DirectionalLight {
        vec3 direction;
        vec3 color;
        float intensity;
        float shadowmapDim;
        vec4 viewPerspMatVecs[4];
    };

    const int dirLightCount = 1;
    const int pointLightCount = 2;
    
    uniform sampler2D texSampler[1 + dirLightCount];
    uniform DirectionalLight directionalLights[dirLightCount];
    uniform PointLight pointLights[pointLightCount];
    uniform vec3 cameraPos;
    uniform vec3 ambient;

    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying vec4 vColor;
    varying vec2 vTexCoord;

    vec3 CalcDirectionalLightCol(DirectionalLight light, vec3 color) 
    {
        // shadow
        mat4 viewPerspMat = mat4(
            light.viewPerspMatVecs[0],
            light.viewPerspMatVecs[1],
            light.viewPerspMatVecs[2],
            light.viewPerspMatVecs[3]);

        vec4 fragCoordLight = viewPerspMat * vec4(vWorldPos, 1.0);
        float texDim = light.shadowmapDim;
        vec2 uv = vec2((fragCoordLight.x + 1.0) / 2.0, (fragCoordLight.y + 1.0) / 2.0);
        float lightDepth = texture2D(texSampler[1], uv).x;
        if(lightDepth < fragCoordLight.z) return vec3(0.0, 0.0, 0.0);

        // diffuse
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(light.direction);
        float diffuse = max(dot(normal, -lightDir), 0.0) * light.intensity;

        // specular
        vec3 camDir =  normalize(cameraPos - vWorldPos);
        vec3 lightReflect = reflect(lightDir, normal);
        const float specularIntensity = .5;
        const float shininess = 20.0;
        float specular = light.intensity * specularIntensity * pow(max(dot(lightReflect, camDir), 0.0), shininess);

        return color * light.color * diffuse + light.color * specular;
    }

    vec3 CalcPointLightCol(PointLight light, vec3 color)
    {
        // diffuse
        vec3 normal = normalize(vNormal);
        vec3 lightVec = light.position - vWorldPos;
        vec3 lightDir = normalize(lightVec);
        
        float dist = length(lightVec);
        float attenuation = 1.0 / (0.1 + 0.1 * dist + 1.0 * dist * dist);
        float diffuse = max(dot(normal, lightDir), 0.0) * attenuation * light.intensity;

        // specular
        vec3 camDir =  normalize(cameraPos - vWorldPos);
        vec3 lightReflect = reflect(-lightDir, normal);
        const float specularIntensity = .5;
        const float shininess = 20.0;
        float specular = light.intensity * specularIntensity * pow(max(dot(lightReflect, camDir), 0.0), shininess) * attenuation;

        return color * light.color * diffuse + light.color * specular;
    }

    void main() {
        vec3 resultCol = vec3(0.0, 0.0, 0.0);

        vec3 color = vec3(0.0, 0.0, 0.0);
        if (vTexCoord.x > -1.0) {
            color = texture2D(texSampler[0], vTexCoord).rgb;
        } else {
            color = vColor.rgb;
        }

        for(int i = 0; i < dirLightCount; ++i)
        {
            resultCol += CalcDirectionalLightCol(directionalLights[i], color);
        }

        for(int i = 0; i < pointLightCount; ++i)
        {
            resultCol += CalcPointLightCol(pointLights[i], color);
        }

        gl_FragColor = vec4(resultCol + ambient, vColor.a);
    }
`;