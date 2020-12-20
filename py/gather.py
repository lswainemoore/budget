import json
import requests


BASE_URL = 'https://api.usaspending.gov'

def get_agencies():
	resp = requests.post(
		BASE_URL + '/api/v2/bulk_download/list_agencies/',
		data={'type': 'account_agencies'}
	)
	return resp.json()['agencies']

def get_agency_info(code):
	resp = requests.get(
		BASE_URL + f'/api/v2/agency/{code}/'
	)
	return resp.json()

def get_budget_functions():
	resp = requests.get(BASE_URL + '/api/v2/budget_functions/list_budget_functions/')
	return resp.json()['results']

def get_budget_subfunctions(function_id):
	resp = requests.post(
		BASE_URL + '/api/v2/budget_functions/list_budget_subfunctions/',
		data={'budget_function': function_id},
	)
	return resp.json()['results']

def get_spending_for_sub_function(function_id, subfunction_id):
	resp = requests.post(
		BASE_URL + '/api/v2/spending/',
		data=json.dumps({
			'type': 'federal_account',
			'filters': {
				'fy': '2019',
				'budget_function': function_id,
				'budget_subfunction': subfunction_id,
				'period': '12',
			}
		}),
		headers={'Content-Type': 'application/JSON'}
	)
	return resp.json()['total']

def main():
	functions = get_budget_functions()
	print(functions)
	for function in functions:
		function['subfunctions'] = get_budget_subfunctions(function['budget_function_code'])

		print(function['budget_function_title'])

		for subfunction in function['subfunctions']:
			subfunction['total'] = get_spending_for_sub_function(function['budget_function_code'], subfunction['budget_subfunction_code'])

	print(json.dumps(functions))
	with open('totals_by_subfunction.json', 'w') as f:
		json.dump({'data': functions}, f)

if __name__ == '__main__':
	main()
