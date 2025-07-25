import TunnelService from '../service/TunnelService';
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useToast } from "primevue/usetoast";
import { useStore } from 'vuex';
NProgress.configure({ showSpinner: true });

const tunnelService = new TunnelService();


/**
 * Progress Start
 * @param to
 * @param form
 * @param next
 */
const progressStart = (to, from, next) => {
  // start progress bar
  if (!NProgress.isStarted()) {
    NProgress.start();
  }
  next();
};

/**
 * App Info Guard
 * @param to
 * @param form
 * @param next
 * @param options
 */
const infoGuard = (to, from, next, options) => {
  const { toast } = options;
	const store = useStore();
	const _info = store.getters['app/info']
	if(!!_info){
		next();
	} else {
		tunnelService.getInfo()
			.then(res => {
				next();
				store.commit('app/setInfo', res);
			})
			.catch(err => console.log('Request Failed', err)); 
		
	}
};

/**
 * Progress Done
 * @param to
 * @param form
 * @param options
 */
const progressDone = () => {
  // finish progress bar
  NProgress.done();
};

export default {
  beforeEach: [
    progressStart,
    infoGuard,
  ],
  afterEach: [progressDone],
};
