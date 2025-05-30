<script setup>
import { ref,onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router'
import { useStore } from 'vuex';
import { downloadFile } from '@/utils/file';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const props = defineProps(['response','loading'])
const emits = defineEmits(['back'])
const back = () => {
	emits('back');
}
const route = useRoute();
const store = useStore();
const result = ref()
const exportCsv = () => {
	let exportData = [];
	if(Array.isArray(props.response?.data)) {
		exportData = props.response?.data;
	} else if (typeof(props.response?.data) == 'object'){
		Object.keys(props.response?.data).forEach((key)=>{
			const _data = {};
			_data[key] = props.response?.data[key]
		});
		exportData.push(_data)
	}
	downloadFile({
		data: exportData,
		fileName:`result`,
		ext: "csv"
	});
}
</script>

<template>


	<div  class="relative h-full min-h-screen w-full" >
		<AppHeader :back="back" >
				<template #center>
					<b>{{t('Result')}}</b>
				</template>
		
				<template #end> 
				</template>
		</AppHeader>
		<Loading v-if="props?.loading"/>
		<div v-else-if="props.response?.data" class="grid mr-2 ml-2 mt-3 mb-5" >
				<button @click="exportCsv" class="layout-config-button p-link" type="button" v-if="!!props.response?.data && (Array.isArray(props.response?.data) || cmdType == 'scan')" style="margin-top:2rem;">
						<i class="pi pi-download"></i>
				</button>
				<Card class="w-full px-4" v-else-if="typeof(props.response?.data) == 'string'">
					<template #content>
						<pre class="app-code w-full"><code>{{props.response?.data}}</code></pre>
					</template>
				</Card>
				<Card class="nopd" v-else-if="Array.isArray(props.response?.data)">
					<template #content>
							<DataTable
								showGridlines
								size="small"
								:value="props.response?.data"
								:rowHover="true"
								resizableColumns
								filterDisplay="menu"
								responsiveLayout="scroll"
							>
									<template #empty> {{t('No result.')}} </template>
									<Column v-if="props.response?.data.length>0" v-for="(k,i) in Object.keys(props.response?.data[0])" :key="k" :showFilterOperator="false" :showFilterMatchModes="false"   :field="k" :header="k" >
											<template #body="{ data }">
												{{data[k]}}
											</template>
									</Column>
									<Column v-else field="result" :header="t('Status')">
										<template #body="{ data }" >
											result
										</template>
									</Column>
							</DataTable>
					</template>
				</Card>
				<card class="nopd" v-else-if="!!props.response?.data?.status">
					<template #content>
						<ul class="list-none p-0 m-0">
							<li :class="{'border-top-1':i>0,'hidden':k == 'result'}" v-for="(k,i) in Object.keys(props.response?.data)" :key="k" class="flex align-items-center py-3 px-5 surface-border flex-wrap">
								<div class="text-tip w-6 md:w-2 font-medium">{{k}}</div>
								<div v-if="k != 'status'" class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{props.response?.data[k]}}</div>
								<div v-else-if="k == 'status'" class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
									<Tag :severity="{OK:'success',ERROR:'danger',FAIL:'danger'}[props.response?.data.status]" :value="props.response?.data.status"></Tag>
								</div>
							</li>
							<li :class="{'hidden':k == 'status'}" v-if="props.response?.data?.result" v-for="(k) in Object.keys(props.response?.data.result)" :key="k" class="border-top-1 flex align-items-center py-3 px-5 surface-border flex-wrap">
								<div class="text-tip w-6 md:w-2 font-medium">{{k}}</div>
								<div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{props.response?.data?.result[k]}}</div>
							</li>
						</ul>
					</template>
				</card>
				<card class="nopd" v-else-if="!!props.response?.data?.error">
					<template #content>
						<ul class="list-none p-0 m-0">
							<li class="flex align-items-center py-3 px-5 surface-border flex-wrap">
								<div class="text-tip w-6 md:w-2 font-medium">{{t('Error')}}</div>
								<div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
									<Tag severity="danger" :value="props.response?.data.error"></Tag>
								</div>
							</li>
						</ul>
					</template>
				</card>
				<card class="nopd" v-else-if="typeof(props.response?.data) == 'object'">
					<template #content>
						<ul class="list-none p-0 m-0">
							<li :class="{'border-top-1':i>0,'hidden':k == 'result'}" v-for="(k,i) in Object.keys(props.response?.data)" :key="k" class="flex align-items-center py-3 px-5 surface-border flex-wrap">
								<div class="text-tip w-6 md:w-2 font-medium">{{k}}</div>
								<div v-if="k != 'status'" class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1 pl-2">{{props.response?.data[k]}}</div>
								<div v-else-if="k == 'status'" class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
									<Tag :severity="{OK:'success',ERROR:'danger',FAIL:'danger'}[props.response?.data.status]" :value="props.response?.data.status"></Tag>
								</div>
							</li>
						</ul>
					</template>
				</card>
		</div>
		<Empty v-else :title="t('No result.')" :error="props.response?.error"/>
	</div>
</template>

<style scoped lang="scss">
::v-deep(.p-breadcrumb){
	border-radius: 0;
	border: none;
}
.hidden{
	display: none !important;
}
::v-deep(.p-listbox-list){
	padding-left: 0;
	padding-right: 0;
	width: 100%;
}
::v-deep(.p-listbox .p-listbox-list .p-listbox-item){
	padding: 0;
}
</style>
