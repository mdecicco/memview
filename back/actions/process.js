const memory = require('memoryjs');

module.exports = function () {
    state.addReducer('process.list', (action, comm) => {
        memory.getProcesses((error, processes) => {
            if (error) {
                comm.send('process.error', error);
            } else {
                comm.send('process.receive', processes.map(p => ({ name: p.szExeFile, id: p.th32ProcessID, info: p })));
            }
        });
    });

    state.addReducer('process.open', (processId, comm) => {
        console.log(`open`, processId);
        memory.openProcess(parseInt(processId, 10), (error, process) => {
            if (error) {
                comm.send('process.error', error);
            } else {
                process.regions = memory.getRegions(process.handle);
                process.modules = memory.getModules(processId);
                comm.send('process.opened', process);
            }
        });
    });
};
