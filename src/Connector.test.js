import Client, * as clientMocks from '@cesarbr/knot-cloud-sdk-js-amqp';
import Connector from './Connector';

jest.mock('@cesarbr/knot-cloud-sdk-js-amqp');

const mockThing = {
  id: 'abcdef1234568790',
  name: 'my-device',
  schema: [
    {
      sensorId: 0,
      typeId: 65521,
      valueType: 3,
      unit: 0,
      name: 'bool-sensor',
    },
  ],
};

const errors = {
  connectClient: 'fail to connect to AMQP channel',
  listenToCommands: 'fail to list registered things from cloud',
};

describe('Connector', () => {
  beforeEach(() => {
    clientMocks.mockConnect.mockClear();
    clientMocks.mockRegister.mockClear();
    clientMocks.mockUnregister.mockClear();
    clientMocks.mockUpdateSchema.mockClear();
    clientMocks.mockGetDevices.mockClear();
    clientMocks.mockPublishData.mockClear();
    clientMocks.mockOn.mockClear();
    clientMocks.mockUnsubscribe.mockClear();
  });

  test('start: should start connector when connection is stablished without errors', async () => {
    const client = new Client();
    const connector = new Connector(client);
    await connector.start();
    expect(clientMocks.mockConnect).toHaveBeenCalled();
    expect(clientMocks.mockGetDevices).toHaveBeenCalled();
  });

  test('connectClient: should connect to client when there is no error', async () => {
    const client = new Client();
    const connector = new Connector(client);
    await connector.connectClient();
    expect(clientMocks.mockConnect).toHaveBeenCalled();
  });

  test('connectClient: should fail to connect when something goes wrong', async () => {
    const client = new Client({ connectErr: errors.connectClient });
    const connector = new Connector(client);
    let error;
    try {
      await connector.connectClient();
    } catch (err) {
      error = err.message;
    }
    expect(clientMocks.mockConnect).toHaveBeenCalled();
    expect(error).toBe(errors.connectClient);
  });

  test('listenToCommands: should start listeners on registered devices when there is no error', async () => {
    const registeredDevices = [mockThing];
    const client = new Client({ registeredDevices });
    const connector = new Connector(client);
    await connector.listenToCommands();
    expect(connector.devices).toEqual([mockThing.id]);
    expect(clientMocks.mockGetDevices).toHaveBeenCalled();
    expect(clientMocks.mockOn).toHaveBeenCalledTimes(
      registeredDevices.length * 2
    );
  });

  test('listenToCommands: should fail to subscribe on commands when unable to get things from cloud', async () => {
    const client = new Client({ getDevicesErr: errors.listenToCommands });
    const connector = new Connector(client);
    let error;
    try {
      await connector.listenToCommands();
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe(errors.listenToCommands);
  });
});
