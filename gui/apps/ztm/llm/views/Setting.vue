<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { merge } from '@/service/common/request';
import JsonEditor from '@/components/editor/JsonEditor.vue';
import LLMService from '../service/LLMService';
import { selectDir } from '@/utils/file';
import { useRoute } from 'vue-router'
import { useToast } from "primevue/usetoast";
import { useStore } from 'vuex';
import _ from "lodash"
import llmSvg from "@/assets/img/llm/deepseek.png";
import mcpSvg from "@/assets/img/mcp/github.png";
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const emits = defineEmits(['save']);
const store = useStore();
const route = useRoute();
const toast = useToast();
const llmService = new LLMService();
const info = computed(() => {
	return store.getters['app/info']
});
const loading = ref(false);
const newMcp = {
	name: '',
	protocol: 'mcp',
	metainfo: {
		version: '',
		provider: '',
		description: ''
	},
	target: {
		address: '',
		argv: [],
		env: {},
	}
}
const mcp = ref(_.cloneDeep(newMcp))
const mcps = ref([])

const newLlm = {
	name: '',
	protocol: 'openai',
	metainfo: {
		version: '',
		provider: '',
		description: ''
	},
	target: {
		address: 'https://api.siliconflow.cn/v1',//'https://api.siliconflow.cn/v1/chat/completions',
		headers: {
			Authorization: 'Bearer <token>',
			"Content-Type": "application/json"
		},
		body: {
			"model":"Pro/deepseek-ai/DeepSeek-V3",
			"stream":false,
			"max_tokens":512,
			"enable_thinking":false,
			"thinking_budget":512,
			"min_p":0.05,
			"stop":null,
			"temperature":0.7,
			"top_p":0.7,
			"top_k":50,
			"frequency_penalty":0.5,
			"n":1,
			"response_format":{"type":"text"},
			"tools":[{"type":"function","function":{"description":"<string>","name":"<string>","parameters":{},"strict":false}}],
		}
	}
}
const llm = ref(_.cloneDeep(newLlm))
const llms = ref([])
const routes = ref([]);
const llmEnabled = computed(() => {
	return !!llm.value.name;
});
const mcpEnabled = computed(() => {
	return !!mcp.value.name;
});

const error = ref();
const llmEditor = ref(false);
const mcpEditor = ref(false);
const savingLlm = ref(false);
const createLlm = () => {
	savingLlm.value = true
	llmService.createService({
		kind: 'llm',
		name: llm.value.name,
		ep: info?.value.endpoint?.id,
		body: {
			...llm.value
		}
	}).then(()=>{
		toast.add({ severity: 'success', summary:t('Tips'), detail: t('Save successfully.'), life: 3000 });
		savingLlm.value = false;
		llmEditor.value = false;
		loaddata();
	}).catch((e)=>{
		savingLlm.value = false;
		llmEditor.value = false;
	})
}
const savingMcp = ref(false);
const createMcp = () => {
	savingMcp.value = true
	llmService.createService({
		kind: 'tool',
		name: mcp.value.name,
		ep: info?.value.endpoint?.id,
		body: {
			...mcp.value
		}
	}).then(()=>{
		toast.add({ severity: 'success', summary:t('Tips'), detail: t('Save successfully.'), life: 3000 });
		savingMcp.value = false;
		mcpEditor.value = false;
		loaddata();
	}).catch((e)=>{
		savingMcp.value = false;
		mcpEditor.value = false;
	})
}
const loaddata = () => {
	llmService.getServices(info?.value.endpoint?.id).then((res)=>{
		llms.value = (res||[]).filter((n) => n.kind == 'llm');
		mcps.value = (res||[]).filter((n) => n.kind == 'tool');
	})
	
	llmService.getRoutes(info?.value.endpoint?.id).then((res)=>{
		routes.value = res.routes||[];
	})
}


const openLlmCreate = () => {
	llmEditor.value = true;
	llm.value = _.cloneDeep(newLlm);
}
const openMcpCreate = () => {
	mcpEditor.value = true;
	mcp.value = _.cloneDeep(newMcp);
}

const openLlmEdit = (t,index) => {
	llmEditor.value = true;
	llmService.getService(info?.value.endpoint?.id,{
		...t
	}).then((res)=>{
		llm.value = res;
	})
	// llm.value = _.cloneDeep(t);
}
const openMcpEdit = (t,index) => {
	mcpEditor.value = true;
	mcp.value = _.cloneDeep(t);
}
const llmRemove = (t,index) => {
	llmService.deleteService({
		ep:t.endpoint?.id, kind:'llm', name:t.name
	},()=>{
		loaddata();
		emits("save");
	})
}
const mcpRemove = (t,index) => {
	llmService.deleteService({
		ep:t.endpoint?.id, kind:'tool', name:t.name
	},()=>{
		loaddata();
		emits("save");
	})
}
const routeRemove = (t,index) => {
	llmService.deleteRoute({
		ep:info?.value.endpoint?.id, path:t.path
	},()=>{
		loaddata();
		emits("save");
	})
}


const browser = () => {
	selectDir((dir)=>{
		mcp.value.target.address = dir;
	})
}

onMounted(() => {
	loaddata()
});
</script>

<template>

	<div class="surface-ground h-full min-h-screen relative ">
		<AppHeader >
				<template #center>
					 <b>{{t('LLM')}}</b>
				</template>
		
				<template #end> 
				</template>
		</AppHeader>
		<ScrollPanel class="absolute-scroll-panel " style="bottom: 0;">
			<Empty v-if="error" :error="error"/>
			<Tabs v-else value="0">
				<TabList>
					<Tab value="0">
						<Tag >{{t('LLM')}}
							<Badge :value="llms.length" />
						</Tag> 
					</Tab>
					<Tab value="1">
						<Tag >{{t('MCP Server')}}
							<Badge :value="mcps.length" />
						</Tag> 
					</Tab>
					<Tab value="2">
						<Tag >{{t('Routes')}}
							<Badge :value="routes.length" />
						</Tag> 
					</Tab>
				</TabList>
				<TabPanels>
					<TabPanel value="0">		
							<Loading v-if="loading" />
							<div v-else class="surface-ground surface-section h-full" >
								<h6 class="flex">
									<div class="flex-item">
										<Button 
											v-if="!loading && !llmEditor" 
											@click="openLlmCreate" 
										  :label="t('Add LLM')"
											size="small" 
											icon="pi pi-plus" ></Button>
										<div v-else-if="!loading" >
											<Button class="mr-2" @click="() => llmEditor = false" size="small" icon="pi pi-angle-left" outlined ></Button>
										</div>
									</div>
									<div class="flex-item text-right">
										<div v-if="llmEditor && !loading" >
											<Button :disabled="!llmEnabled" @click="createLlm()()" :loading="savingLlm"  size="small" icon="pi pi-check" ></Button>
										</div>
								</div>
								</h6>
								<ul v-if="llmEditor" class="list-none p-0 m-0">
									<FormItem :label="t('Name')" :border="true">
										<Chip class="pl-0 pr-3 mr-2">
												<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
													<i class="pi pi-bookmark"/>
												</span>
												<span class="ml-2 font-medium">
													<InputText :placeholder="t('Name your LLM')" class="add-tag-input xxl" :unstyled="true" v-model="llm.name" type="text" />
												</span>
										</Chip>
									</FormItem>
									<FormItem :label="t('Url')" :border="false">
										<Chip class="pl-0 pr-3 mr-2">
												<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
													<i class="pi pi-link"/>
												</span>
												<span class="ml-2 font-medium">
													<InputText :placeholder="t('LLM Address')" class="add-tag-input xxl" style="width: 300px;" :unstyled="true" v-model="llm.target.address" type="text" />
												</span>
										</Chip>
									</FormItem>
									<FormItem :label="t('Headers')" :border="false">
										<ChipMap direction="v" icon="pi-desktop" :placeholder="t('key:value')" v-model:map="llm.target.headers" />
									</FormItem>
									<FormItem :label="t('Body')" :border="false">
										<JsonEditor id="llmBody" height="240px" type="object" v-model:value="llm.target.body"/>
									</FormItem>
									<FormItem :label="t('Description')" :border="false">
										<Textarea class="w-full"  v-model="llm.metainfo.description" rows="2" cols="20" />
									</FormItem>
									
								</ul>
								<DataView class="transparent" v-else :value="llms">
									<template #empty>
										{{t('No LLM.')}}
									</template>
									<template #list="slotProps">
										<div class="surface-border py-3" :class="{'border-top-1':index>0}" v-for="(item, index) in slotProps.items" :key="index">
												<div class="flex py-2 gap-4" :class="{ 'border-t border-surface-200 dark:border-surface-700': index !== 0 }">
														<div>
															<img :src="llmSvg" width="30px" />
														</div>
														<div class="flex flex-col pr-2 flex-item">
															<div class="text-lg font-medium align-items-start flex flex-column" style="justify-content: start;">
																<span>
																	<b>{{item.name}}</b> 
																	<Tag class="ml-2" v-if="item.protocol">{{item.protocol}}</Tag>
																	<Tag class="ml-2" v-if="item.metainfo?.version">{{item.metainfo?.version}}</Tag>
																</span>
																<span class="mt-1">{{item?.metainfo?.description||'(No description)'}}</span>
															</div>
														</div>
														<div class="flex flex-column xl:flex-row-reverse  xl:flex-row gap-2">
																<Button @click="openLlmEdit(item,index)" size="small" icon="pi pi-pencil" class="flex-auto md:flex-initial whitespace-nowrap"></Button>
																<Button @click="llmRemove(item,index)" size="small" icon="pi pi-trash" outlined></Button>
														</div>
												</div>
										</div>
									</template>
								</DataView>
							</div>
					</TabPanel>
					<TabPanel value="1">
							<Loading v-if="loading" />
							<div v-else class="surface-ground surface-section h-full" >
								<h6 class="flex">
									<div class="flex-item">
										<Button 
											v-if="!loading && !mcpEditor" 
											@click="openMcpCreate" 
											:label="t('Add MCP Server')" 
											size="small" 
											icon="pi pi-plus" ></Button>
										<div v-else-if="!loading" >
											<Button class="mr-2" @click="() => mcpEditor = false" size="small" icon="pi pi-angle-left" outlined ></Button>
										</div>
									</div>
									<div class="flex-item text-right">
										<div v-if="mcpEditor && !loading" >
											<Button :disabled="!mcpEnabled"  @click="createMcp()" :loading="savingMcp"  size="small" icon="pi pi-check" ></Button>
										</div>
									</div>
								</h6>
								<ul v-if="mcpEditor" class="list-none p-0 m-0">
									<FormItem :label="t('Name')" :border="true">
										<Chip class="pl-0 pr-3 mr-2">
												<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
													<i class="pi pi-bookmark"/>
												</span>
												<span class="ml-2 font-medium">
													<InputText :placeholder="t('Name your MCP Server')" class="add-tag-input xxl" style="width: 200px;" :unstyled="true" v-model="mcp.name" type="text" />
												</span>
										</Chip>
									</FormItem>
									<FormItem :label="t('Url')" :border="false">
										<Chip class="pl-0 pr-3 mr-2">
												<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
													<i class="pi pi-link"/>
												</span>
												<span class="ml-2 font-medium">
													<InputText :placeholder="t('MCP Server Address')" class="add-tag-input xxl" style="width: 300px;" :unstyled="true" v-model="mcp.target.address" type="text" />
												</span>
												<Button style="left:10px;border-radius:16px;" class="relative" size="small" @click="browser" icon="pi pi-folder"></Button>
										</Chip>
									</FormItem>
									<FormItem :label="t('Arguments')" :border="false">
										<ChipList direction="v" icon="pi-desktop" :placeholder="t('Add')" v-model:list="mcp.target.argv" />
									</FormItem>
									<FormItem :label="t('Environment')" :border="false">
										<ChipMap direction="v" icon="pi-desktop" :placeholder="t('Add')" v-model:map="mcp.target.env" />
									</FormItem>
									<!-- <FormItem :label="t('Body')" :border="false">
										<JsonEditor id="mcpBody" height="140px" type="object" v-model:value="mcp.target.body"/>
									</FormItem> -->
									<FormItem :label="t('Description')" :border="false">
										<Textarea class="w-full"  v-model="mcp.metainfo.description" rows="2" cols="20" />
									</FormItem>
								</ul>
								<DataView  class="transparent" v-else :value="mcps">
									<template #empty>
										{{t('No MCP Server.')}}
									</template>
									<template #list="slotProps">
										<div class="surface-border py-3" :class="{'border-top-1':index>0}" v-for="(item, index) in slotProps.items" :key="index">
												<div class="flex py-2 gap-4" :class="{ 'border-t border-surface-200 dark:border-surface-700': index !== 0 }">
														<div>
															<img :src="mcpSvg" width="30px" />
														</div>
														<div class="flex flex-col pr-2 flex-item">
															<div class="text-lg font-medium align-items-start flex flex-column" style="justify-content: start;">
																<span>
																	<b>{{item.name}}</b> 
																	<Tag class="ml-2" v-if="item.protocol">{{item.protocol}}</Tag>
																	<Tag class="ml-2" v-if="item.metainfo?.version">{{item.metainfo?.version}}</Tag>
																</span>
																<span class="mt-1">{{item?.metainfo?.description||'(No description)'}}</span>
															</div>
														</div>
														<div class="flex flex-column xl:flex-row-reverse  xl:flex-row gap-2">
																<Button @click="openMcpEdit(item,index)" size="small" icon="pi pi-pencil" class="flex-auto md:flex-initial whitespace-nowrap"></Button>
																<Button @click="mcpRemove(item,index)" size="small" icon="pi pi-trash" outlined></Button>
														</div>
												</div>
										</div>
									</template>
								</DataView>
							</div>
					</TabPanel>
					<TabPanel value="2">
						<Loading v-if="loading" />
						<div v-else class="surface-ground surface-section h-full" >
							<DataView class="transparent" :value="routes">
								<template #empty>
									{{t('No Routes.')}}
								</template>
								<template #list="slotProps">
									<div class="surface-border py-3" :class="{'border-top-1':index>0}" v-for="(item, index) in slotProps.items" :key="index">
											<div class="flex py-2 gap-4" :class="{ 'border-t border-surface-200 dark:border-surface-700': index !== 0 }">
													<div>
														<i class="pi pi-link text-primary-500"/>
													</div>
													<div class="flex flex-col pr-2 flex-item">
														<div class="text-lg font-medium align-items-start flex flex-column" style="justify-content: start;">
															<span>
																<b>{{item.path}}</b> 
															</span>
															<span class="mt-1">
																<Tag class="mr-2" v-if="item.service?.kind">{{item.service?.kind}}</Tag>
																{{item?.service?.name}}
															</span>
														</div>
													</div>
													<div class="flex flex-column xl:flex-row-reverse  xl:flex-row gap-2">
															<Button @click="routeRemove(item,index)" size="small" icon="pi pi-trash" outlined></Button>
													</div>
											</div>
									</div>
								</template>
							</DataView>
						</div>
					</TabPanel>
				</TabPanels>	
			</Tabs>
		</ScrollPanel>
	</div>
</template>

<style scoped lang="scss">
:deep(.p-breadcrumb){
	border-radius: 0;
	border-left: none;
	border-right: none;
}
.bootstrap{
	:deep(.add-tag-input){
		width:120px;
	}
	:deep(.add-tag-input:hover){
		width:160px;
	}
}
:deep(.p-accordioncontent-content){
	padding: 0;
}
</style>
