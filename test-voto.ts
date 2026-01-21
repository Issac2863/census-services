// test-voto.ts
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function run() {
  const logger = new Logger('TestClient');

  // 1. Conectamos al Census Service (Puerto 3002)
  const client = ClientProxyFactory.create({
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: 3002 },
  });

  const cedulaTest = '1500958069'; // Uno de los usuarios mockeados en tu servicio

  try {
    logger.log('--- INICIANDO PROCESO DE VOTACIÓN ---');

    // Paso A: Verificar estado
    logger.log('1. Verificando estado...');
    const estado = await client.send('census.check-status', { cedula: cedulaTest }).toPromise();
    console.log('Estado:', estado);

    // Paso B: Iniciar votación (NO_VOTO -> VOTANDO)
    logger.log('2. Iniciando votación...');
    await client.send('census.start-voting', { cedula: cedulaTest }).toPromise();
    
    // Paso C: Guardar voto (VOTANDO -> GUARDANDO_VOTO)
    logger.log('3. Guardando voto...');
    await client.send('census.save-vote', { cedula: cedulaTest }).toPromise();

    // Paso D: Confirmar voto (GUARDANDO_VOTO -> VOTO)
    // ¡ESTO ES LO QUE DISPARA EL EVENTO AL OTRO SERVICIO!
    logger.log('4. Confirmando voto (Disparando evento)...');
    const resultado = await client.send('census.confirm-vote', { cedula: cedulaTest }).toPromise();
    
    console.log('✅ Resultado Final:', resultado);
    logger.log('--- ESPERANDO QUE LLEGUE EL CORREO ---');

  } catch (error) {
    logger.error('❌ Error en el test:', error);
  } finally {
    client.close();
  }
}

run();